import { relative, resolve } from 'node:path'
import { default as fs } from 'fs-extra'
import { globby } from 'globby'
import remarkParse from 'remark-parse'
import { type Plugin, unified } from 'unified'
import { type PluginOption } from 'vite'
import { parse } from 'yaml'

import type { BlogPost, Frontmatter } from '../../app/types.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { getRemarkPlugins } from './mdx.js'

const remarkPlugins = getRemarkPlugins()

export function virtualBlog(): PluginOption {
  const virtualModuleId = 'virtual:blog'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'blog',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const { config } = await resolveVocsConfig()
        const { blogDir, rootDir } = config

        const blogDir_resolved = resolve(rootDir, blogDir)

        const files = await globby(`${blogDir_resolved}/**/*.{md,mdx}`)

        const posts: BlogPost[] = []

        for (const file of files) {
          if (file.startsWith(`${blogDir_resolved}/index`)) continue
          const contents = fs.readFileSync(file, 'utf-8')
          const parser = unified().use(remarkParse)
          for (const plugin of remarkPlugins) {
            parser.use(plugin as Plugin)
          }
          const ast = parser.parse(contents)

          const frontmatter = (() => {
            let frontmatter = {}
            for (const node of ast.children) {
              if (node.type === 'yaml') {
                frontmatter = parse(node.value)
                break
              }
            }
            return frontmatter as Frontmatter
          })()

          let description = (() => {
            if (frontmatter.description) return frontmatter.description
            for (const node of ast.children) {
              if (node.type === 'paragraph') {
                return (node.children[0] as any).value as string
              }
            }
            return ''
          })()
          if (description.length > 200) description = `${description.slice(0, 200)}…`

          const title = (() => {
            if (frontmatter.title) return frontmatter.title
            for (const node of ast.children) {
              if (node.type === 'heading' && node.depth === 1) {
                return (node.children[0] as any).value as string
              }
            }
            return ''
          })()

          const date = (() => {
            if (frontmatter.date) return frontmatter.date
            const { mtime } = fs.statSync(file)
            return mtime.toISOString()
          })()

          const path = `/${relative(resolve(rootDir, 'pages'), file).replace(/\.(md|mdx)$/, '')}`

          posts.push({
            authors: frontmatter.authors,
            date,
            description,
            path,
            title,
          })
        }

        posts.sort((a, b) => {
          if (!a.date) return 1
          if (!b.date) return -1
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        })

        return `export const posts = ${JSON.stringify(posts)};`
      }
      return
    },
    handleHotUpdate() {
      // TODO: handle changes
      return
    },
  }
}
