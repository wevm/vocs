import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { directiveToMarkdown } from 'mdast-util-directive'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { mdxJsxToMarkdown } from 'mdast-util-mdx-jsx'
import { toMarkdown } from 'mdast-util-to-markdown'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

/**
 * Finds the markdown file path for a given URL path.
 * Returns null if no matching file is found.
 */
export function findMarkdownFile(urlPath: string, rootDir: string): string | null {
  const pagesDir = resolve(rootDir, 'pages')

  // Clean the URL path
  let cleanPath = urlPath
    .replace(/\.html$/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  if (!cleanPath) cleanPath = 'index'

  // Try different file extensions and patterns
  const candidates = [
    resolve(pagesDir, `${cleanPath}.mdx`),
    resolve(pagesDir, `${cleanPath}.md`),
    resolve(pagesDir, cleanPath, 'index.mdx'),
    resolve(pagesDir, cleanPath, 'index.md'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

/**
 * Processes markdown content for AI agents:
 * - Removes :::human-only content
 * - Unwraps :::agent-only content (keeps children, removes wrapper)
 * - Removes frontmatter
 */
export function processMarkdownForAgent(content: string): string {
  const parser = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkDirective)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkStringify)

  const ast = parser.parse(content)

  // Remove frontmatter
  visit(ast, 'yaml', (_, i, parent: any) => {
    if (!parent || typeof i !== 'number') return
    parent.children.splice(i, 1)
    return i
  })

  // Filter audience directives
  visit(ast, 'containerDirective', (node: any, i, parent: any) => {
    if (!parent || typeof i !== 'number') return
    if (node.name === 'human-only') {
      parent.children.splice(i, 1)
      return i
    }
    if (node.name === 'agent-only') {
      parent.children.splice(i, 1, ...node.children)
      return i
    }
  })

  return toMarkdown(ast, {
    extensions: [directiveToMarkdown(), gfmToMarkdown(), mdxJsxToMarkdown(), mdxToMarkdown()],
  })
}

/**
 * Reads and processes a markdown file for AI agents.
 * Returns processed markdown content or null if file not found.
 */
export function getProcessedMarkdownForAgent(urlPath: string, rootDir: string): string | null {
  const filePath = findMarkdownFile(urlPath, rootDir)
  if (!filePath) return null

  const content = readFileSync(filePath, 'utf-8')
  return processMarkdownForAgent(content)
}
