import { resolve } from 'node:path'
import { default as fs } from 'fs-extra'
import { globby } from 'globby'
import { toMarkdown } from 'mdast-util-to-markdown'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { type Plugin, unified } from 'unified'
import { visit } from 'unist-util-visit'
import type { PluginOption, UserConfig } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { getRemarkPlugins } from './mdx.js'

const remarkPlugins = getRemarkPlugins()

export async function llms(): Promise<PluginOption> {
  let viteConfig: UserConfig | undefined
  return {
    name: 'llms',
    config(c) {
      viteConfig = c
    },
    async buildStart() {
      const outDir = viteConfig?.build?.outDir
      if (!outDir) return

      const { config } = await resolveVocsConfig()
      const { description, rootDir, title = 'Docs' } = config ?? {}

      const content = [`# ${title}`, '']
      if (description) content.push(`> ${description}`, '')

      const pagesPath = resolve(rootDir, 'pages')
      const glob = `${pagesPath}/**/*.{md,mdx}`
      const files = await globby(glob)

      content.push('## Docs', '')

      for (const file of files) {
        let path = file.replace(pagesPath, '').replace(/\.[^.]*$/, '')
        if (path.endsWith('index')) path = path.replace('index', '').replace(/\/$/, '')

        if (!path) continue

        const contents = fs.readFileSync(file, 'utf-8')
        const parser = unified().use(remarkParse).use(remarkMdx)
        for (const plugin of remarkPlugins) parser.use(plugin as Plugin)

        const ast = parser.parse(contents)

        visit(ast, { type: 'heading', depth: 1 }, (n, i) => {
          const node = n.children[0]
          if (node.type !== 'text') return

          const value = node.value
          const [, title, subTitle] = value.match(/^([^\[\]]+)(?: \[([^\[\]]+)\])?$/) ?? []

          let found = false
          let description = subTitle
          if (!description)
            visit(ast, { type: 'paragraph' }, (n, j) => {
              if (found) return
              if (j && i && j <= i) return
              found = true
              description = toMarkdown(n).trim()
              return
            })

          content.push(`- [${title}](${path})${description ? `: ${description}` : ''}`)
        })
      }

      const llmsTxt = content.join('\n')

      fs.ensureDirSync(outDir)
      fs.writeFileSync(resolve(outDir, 'llms.txt'), llmsTxt)
    },
  }
}
