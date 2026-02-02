import fs from 'node:fs/promises'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import type { PluggableList } from 'unified'
import { unified } from 'unified'
import type * as Config from './config.js'

export async function buildLlmsContent(options: buildLlmsContent.Options) {
  const { pages, title, description, rehypePlugins, remarkPlugins } = options

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
    .then((data) =>
      data.sort((a, b) => {
        const depthA = a.path.split('/').filter(Boolean).length
        const depthB = b.path.split('/').filter(Boolean).length
        if (depthA !== depthB) return depthA - depthB
        return a.path.localeCompare(b.path)
      }),
    )

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

  const resultsWithSitemap = results.map((r) => ({ ...r, content: sitemap + r.content }))

  return { full: full.join('\n'), results: resultsWithSitemap, short: short.join('\n') }
}

export declare namespace buildLlmsContent {
  type Options = {
    pages: Page[]
    title: string
    description?: string | undefined
    rehypePlugins: PluggableList
    remarkPlugins: PluggableList
  }

  type Page = {
    path: string
    content: string | { path: string }
  }
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
