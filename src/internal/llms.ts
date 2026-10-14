import fs from 'node:fs/promises'
import * as path from 'node:path'
import type { Root } from 'mdast'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import type { PluggableList } from 'unified'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import type * as Config from './config.js'
import * as MarkdownComponents from './markdown-components.js'
import * as MarkdownImports from './markdown-imports.js'
import * as MarkdownOutput from './markdown-output.js'
import * as OpenApiMarkdown from './openapi/markdown.js'
import type * as Sidebar from './sidebar.js'

/**
 * Compile one content inventory into page Markdown and both LLM exports.
 * Returns diagnostics without enforcing them; Vite and CLI callers apply the selected mode.
 * Renderer and parse failures reject because they cannot produce a trustworthy artifact.
 */
export async function buildLlmsContent(options: buildLlmsContent.Options) {
  const {
    componentOptions,
    title,
    description,
    pagePrelude,
    rehypePlugins,
    remarkPlugins,
    sidebar,
  } = options

  // Dedupe by path (first occurrence wins), so consumer-authored source pages
  // take precedence over generated pages (e.g. OpenAPI) mounted at the same path.
  const diagnostics: MarkdownOutput.Diagnostic[] = []
  const seen = new Set<string>()
  const pages = options.pages.filter((page) => {
    const key = normalizePath(page.path)
    if (seen.has(key)) {
      // Generated OpenAPI pages intentionally overlay authored pages at their mount.
      if (
        !options.pages.some((candidate) => normalizePath(candidate.path) === key && candidate.title)
      )
        diagnostics.push({
          rule: 'duplicate-page',
          file: page.path,
          message: 'Multiple source pages publish the same Markdown route.',
        })
      return false
    }
    seen.add(key)
    return true
  })

  const results = await Promise.all(
    pages.map(async (page) => {
      // Pre-rendered pages (e.g. generated OpenAPI references) carry their own
      // title and final Markdown, so they bypass the MDX reprocessing and the
      // frontmatter-title requirement and are used verbatim.
      if (page.title) {
        const content =
          typeof page.content === 'string'
            ? page.content
            : await fs.readFile(page.content.path, 'utf-8')
        return {
          content,
          file: undefined,
          title: page.title,
          description: page.description,
          path: page.path,
        }
      }

      const rawContent =
        typeof page.content === 'string'
          ? page.content
          : await fs.readFile(page.content.path, 'utf-8')
      const content =
        typeof page.content === 'string'
          ? rawContent
          : await MarkdownImports.inlineMarkdownImportsAsync(
              rawContent,
              page.content.path,
              (source, filePath) =>
                MarkdownComponents.inlineMarkdownComponents(source, filePath, {
                  ...componentOptions,
                  pageUrl: page.path,
                }),
            )
      const file = await unified()
        .use(remarkParse)
        .use(remarkMdx)
        .use(remarkStringify)
        .use(remarkPlugins)
        .use(rehypePlugins)
        .use(() => (tree: Root) => {
          // Aggregated pages lose their original URL context. Resolve links once so
          // the standalone and full exports can retain exactly the same body.
          visit(tree, (node) => {
            if (node.type !== 'link' && node.type !== 'image' && node.type !== 'definition') return
            if (/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(node.url)) return
            const url = new URL(node.url, `https://vocs.invalid${page.path}`)
            node.url = `${url.pathname}${url.search}${url.hash}`
          })
        })
        .process(content)

      const { title, description } = (file?.data?.['frontmatter'] ?? {}) as Config.Frontmatter
      if (!title)
        diagnostics.push({
          rule: 'missing-title',
          file: page.path,
          message: 'Provide a page title; the route is used as a fallback.',
        })

      return {
        content: String(file),
        file,
        title: title || page.path,
        description,
        path: page.path,
      }
    }),
  ).then((data) => sortResults(data, sidebar))

  const llmsTxtContent: string[] = [`# ${title}`, '']
  if (description) llmsTxtContent.push(description, '')

  const nav = []
  for (const { title, description, path } of results)
    nav.push(
      `- [${escapeLabel(title)}](${path === '/' ? '/index' : path.replace(/\/$/, '')}.md)${description ? `: ${description.replace(/\s+/g, ' ').trim()}` : ''}`,
    )

  const sitemap = ['<!--', 'Sitemap:', ...nav, '-->', ''].join('\n')
  const short = [...llmsTxtContent, ...nav]

  const pageResults = pagePrelude
    ? results.map((result) => ({
        ...result,
        content: `${pagePrelude}\n\n${result.content}`,
      }))
    : results

  for (const page of pageResults)
    diagnostics.push(...MarkdownOutput.inspect(page.content, page.path, seen))
  diagnostics.sort(
    (a, b) =>
      a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0) || a.rule.localeCompare(b.rule),
  )
  const report = {
    ...MarkdownOutput.resolveValidation({ config: options.validation }),
    diagnostics,
  }
  const full = [
    ...llmsTxtContent,
    sitemap,
    ...pageResults.map((page) => `<!-- Source: ${page.path} -->\n\n${page.content}`),
  ]
  return { full: full.join('\n'), results: pageResults, short: short.join('\n'), report }
}

export declare namespace buildLlmsContent {
  type Options = {
    validation?: 'warn' | 'fail' | undefined
    componentOptions?: MarkdownComponents.inlineMarkdownComponents.Options | undefined
    pages: Page[]
    title: string
    description?: string | undefined
    pagePrelude?: string | undefined
    rehypePlugins: PluggableList
    remarkPlugins: PluggableList
    sidebar?: Config.Config['sidebar'] | undefined
  }

  type Page = {
    path: string
    content: string | { path: string }
    /**
     * When provided, `content` is treated as final Markdown and used verbatim
     * (the MDX reprocessing and frontmatter-title requirement are skipped). Used
     * for generated pages such as OpenAPI references.
     */
    title?: string | undefined
    description?: string | undefined
  }
}

/** Shared page guidance, included identically in individual and full Markdown exports. */
export function getMarkdownPagePrelude(config: getMarkdownPagePrelude.Options) {
  if (!config.mcp?.enabled) return undefined

  const baseUrl = config.baseUrl?.replace(/\/$/, '') ?? ''
  const basePathValue = config.basePath.replace(/^\/+|\/+$/g, '')
  const basePath = basePathValue ? `/${basePathValue}` : ''
  const mcpUrl = `${baseUrl}${basePath}/api/mcp`
  const lines = [
    `> **Can't find what you're looking for?** Use \`search_docs\` on the docs MCP server at \`${mcpUrl}\` to find what you need.`,
  ]

  if (config.feedback)
    lines.push('> **Have feedback?** Use `submit_feedback` on the same MCP server.')

  return lines.join('\n>\n')
}

export declare namespace getMarkdownPagePrelude {
  type Options = Pick<Config.Config, 'basePath' | 'baseUrl' | 'feedback' | 'mcp'>
}

/**
 * Generated Markdown pages for every configured OpenAPI section, in the
 * {@link buildLlmsContent.Page} shape (pre-rendered, so they're served verbatim).
 * Empty when no OpenAPI specs are configured.
 */
export async function getOpenApiPages(config: Config.Config): Promise<buildLlmsContent.Page[]> {
  const pages = await OpenApiMarkdown.toPages(config)
  return pages.map((page) => ({
    path: page.path,
    content: page.content,
    title: page.title,
    description: page.description,
  }))
}

function sortResults<result extends { path: string }>(
  results: result[],
  sidebar: Config.Config['sidebar'],
): result[] {
  const order = getSidebarOrder(sidebar)

  return results.sort((a, b) => {
    const orderA = order.get(normalizePath(a.path))
    const orderB = order.get(normalizePath(b.path))

    if (orderA !== undefined && orderB !== undefined) return orderA - orderB
    if (orderA !== undefined) return -1
    if (orderB !== undefined) return 1

    const depthA = a.path.split('/').filter(Boolean).length
    const depthB = b.path.split('/').filter(Boolean).length
    if (depthA !== depthB) return depthA - depthB
    return a.path.localeCompare(b.path)
  })
}

function getSidebarOrder(sidebar: Config.Config['sidebar']): Map<string, number> {
  const order = new Map<string, number>()
  let index = 0

  const push = (link: string) => {
    const normalized = normalizePath(link)
    if (isExternalLink(normalized) || order.has(normalized)) return
    order.set(normalized, index++)
  }

  const traverse = (items: readonly Sidebar.SidebarItem<true>[] | undefined) => {
    if (!items) return
    for (const item of items) {
      if (item.link) push(item.link)
      traverse(item.items)
    }
  }

  if (Array.isArray(sidebar)) {
    traverse(sidebar)
    return order
  }

  if (sidebar && typeof sidebar === 'object') {
    for (const value of Object.values(sidebar)) {
      if (Array.isArray(value)) traverse(value)
      else traverse(value.items)
    }
  }

  return order
}

function normalizePath(path: string): string {
  if (path === '/') return '/'
  return path.replace(/\/$/, '')
}

function isExternalLink(link: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(link)
}

/** Discover authored Markdown routes, excluding private underscore-prefixed files/directories. */
export async function getPagesFromDir(pagesDir: string): Promise<buildLlmsContent.Page[]> {
  const files = await Array.fromAsync(fs.glob(`${pagesDir}/**/*.{md,mdx}`))
  return files
    .filter(
      (file) =>
        !path
          .relative(pagesDir, file)
          .split(path.sep)
          .some((part) => part.startsWith('_')),
    )
    .sort()
    .map((file) => ({
      path:
        file
          .replace(pagesDir, '')
          .replace(/\.mdx?$/, '')
          .replace(/\/$/, '')
          .replace(/(^|\/)index$/, '$1')
          .replace(/\/$/, '') || '/',
      content: { path: file },
    }))
}

function escapeLabel(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[\\[\]]/g, '\\$&')
    .trim()
}
