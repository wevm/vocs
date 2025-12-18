import { glob } from 'node:fs/promises'
import { resolve } from 'node:path'
import { default as fs } from 'fs-extra'
import type { Heading } from 'mdast'
import { directiveToMarkdown } from 'mdast-util-directive'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { mdxJsxToMarkdown } from 'mdast-util-mdx-jsx'
import { toMarkdown } from 'mdast-util-to-markdown'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { type Plugin, unified } from 'unified'
import { visit } from 'unist-util-visit'
import type { PluginOption, UserConfig } from 'vite'

import * as cache from '../utils/cache.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { getRemarkPlugins } from './mdx.js'

const remarkPlugins = getRemarkPlugins()

export async function llms(): Promise<PluginOption[]> {
  let viteConfig: UserConfig | undefined
  return [
    {
      name: 'llms',
      config(c) {
        viteConfig = c
      },
      async buildStart() {
        const outDir = viteConfig?.build?.outDir
        if (!outDir) return

        const { config } = await resolveVocsConfig()
        const { basePath, cacheDir, description, rootDir, title = 'Docs' } = config ?? {}

        // Check if agentMarkdown flag was set during build
        const agentMarkdown = cache.search({ cacheDir }).get('agentMarkdown') ?? false

        const content = [`# ${title}`, '']
        if (description) content.push(`> ${description}`, '')

        const pagesPath = resolve(rootDir, 'pages')
        const globPattern = `${pagesPath}/**/*.{md,mdx}`
        const files = await Array.fromAsync(glob(globPattern))

        const llmsTxtContent = [...content, '## Docs', '']
        const llmsCtxTxtContent = content

        for (const file of files) {
          try {
            let path = file.replace(pagesPath, '').replace(/\.[^.]*$/, '')
            if (path.endsWith('index')) path = path.replace('index', '').replace(/\/$/, '')

            if (!path) continue

            const contents = fs.readFileSync(file, 'utf-8')
            const parser = unified().use(remarkParse).use(remarkMdx).use(remarkStringify)
            for (const plugin of remarkPlugins) parser.use(plugin as Plugin)

            const ast = parser.parse(contents)

            // process llms.txt content
            visit(ast, { type: 'heading', depth: 1 }, (n, i) => {
              const node = n.children[0]
              if (node.type !== 'text') return

              const value = node.value
              const [, title, subTitle] = value.match(/^([^[\]]+)(?: \[([^[\]]+)\])?$/) ?? []

              let found = false
              let description = subTitle
              if (!description)
                visit(ast, { type: 'paragraph' }, (n, j) => {
                  if (found) return
                  if (j && i && j <= i) return
                  found = true
                  description = toMarkdown(n, { extensions: [mdxJsxToMarkdown()] }).trim()
                  return
                })

              // Link to .md files if agentMarkdown is enabled, otherwise link to HTML pages
              const linkExtension = agentMarkdown ? '.md' : ''
              llmsTxtContent.push(
                `- [${title}](${basePath}${path}${linkExtension})${description ? `: ${description}` : ''}`,
              )
            })

            visit(
              ast,
              (n) => n.type === 'heading',
              (n) => {
                const node = n as Heading
                if (node.depth === 1 || node.depth === 2 || node.depth === 3 || node.depth === 4)
                  node.depth = (node.depth + 1) as 2 | 3 | 4 | 5
              },
            )

            // remove frontmatter
            visit(ast, { type: 'yaml' }, (_, i, p) => {
              if (!p) return
              if (typeof i !== 'number') return
              p.children.splice(i, 1)
            })

            // filter audience directives for llms output:
            // - remove human-only content (not for AI agents)
            // - unwrap agent-only content (include it, but remove the directive wrapper)
            visit(ast, 'containerDirective', (node: any, i, parent: any) => {
              if (!parent || typeof i !== 'number') return
              if (node.name === 'human-only') {
                // Remove human-only content entirely
                parent.children.splice(i, 1)
                return i // Revisit this index since we removed an element
              }
              if (node.name === 'agent-only') {
                // Unwrap agent-only content (keep children, remove wrapper)
                parent.children.splice(i, 1, ...node.children)
                return i // Revisit this index
              }
            })

            llmsCtxTxtContent.push(
              toMarkdown(ast, {
                extensions: [
                  directiveToMarkdown(),
                  gfmToMarkdown(),
                  mdxJsxToMarkdown(),
                  mdxToMarkdown(),
                ],
              }),
              '',
            )
          } catch (e) {
            console.error(e)
          }
        }

        const llmsTxt = llmsTxtContent.join('\n')
        const llmsCtxTxt = llmsCtxTxtContent.join('\n')

        fs.ensureDirSync(outDir)
        fs.writeFileSync(resolve(outDir, 'llms.txt'), llmsTxt)
        fs.writeFileSync(resolve(outDir, 'llms-full.txt'), llmsCtxTxt)
      },
    },
  ]
}
