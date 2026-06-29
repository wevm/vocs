import fs from 'node:fs/promises'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import type { PluggableList } from 'unified'
import { unified } from 'unified'
import type * as Config from './config.js'
import * as MarkdownImports from './markdown-imports.js'
import * as OpenApiMarkdown from './openapi/markdown.js'
import type * as Sidebar from './sidebar.js'

export async function buildLlmsContent(options: buildLlmsContent.Options) {
  const { title, description, rehypePlugins, remarkPlugins, sidebar } = options

  // Dedupe by path (first occurrence wins), so consumer-authored source pages
  // take precedence over generated pages (e.g. OpenAPI) mounted at the same path.
  const seen = new Set<string>()
  const pages = options.pages.filter((page) => {
    const key = normalizePath(page.path)
    if (seen.has(key)) return false
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
          : MarkdownImports.inlineMarkdownImports(rawContent, page.content.path)
      const file = await unified()
        .use(remarkParse)
        .use(remarkMdx)
        .use(remarkStringify)
        .use(remarkPlugins)
        .use(rehypePlugins)
        .process(content)

      const { title, description } = (file?.data?.['frontmatter'] ?? {}) as Config.Frontmatter
      if (!title) return null

      return {
        content: String(file),
        file,
        title,
        description,
        path: page.path,
      }
    }),
  )
    .then((data) => data.filter((data): data is NonNullable<typeof data> => data !== null))
    .then((data) => sortResults(data, sidebar))

  const llmsTxtContent: string[] = [`# ${title}`, '']
  if (description) llmsTxtContent.push(description, '')

  const nav = []
  for (const { title, description, path } of results)
    nav.push(
      `- [${title}](${path === '/' ? '/index' : path})${description ? `: ${description}` : ''}`,
    )

  const sitemap = ['<!--', 'Sitemap:', ...nav, '-->', ''].join('\n')
  const short = [...llmsTxtContent, ...nav]
  const full = [...llmsTxtContent, sitemap, ...results.map((r) => r.content)]

  return { full: full.join('\n'), results, short: short.join('\n') }
}

export declare namespace buildLlmsContent {
  type Options = {
    pages: Page[]
    title: string
    description?: string | undefined
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

export async function getPagesFromDir(pagesDir: string): Promise<buildLlmsContent.Page[]> {
  const files = await Array.fromAsync(fs.glob(`${pagesDir}/**/*.{md,mdx}`))
  return files.map((file) => ({
    path: file
      .replace(pagesDir, '')
      .replace(/\.mdx?$/, '')
      .replace(/\/$/, '')
      .replace(/index$/, ''),
    content: { path: file },
  }))
}
