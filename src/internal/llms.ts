import fs from 'node:fs/promises'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import type { PluggableList } from 'unified'
import { unified } from 'unified'
import type * as Config from './config.js'
import type * as Sidebar from './sidebar.js'

export async function buildLlmsContent(options: buildLlmsContent.Options) {
  const { pages, title, description, rehypePlugins, remarkPlugins, sidebar } = options

  const results = await Promise.all(
    pages.map(async (page) => {
      const content =
        typeof page.content === 'string'
          ? page.content
          : await fs.readFile(page.content.path, 'utf-8')
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
  }
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
