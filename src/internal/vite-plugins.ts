import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import mdxPlugin from '@mdx-js/rollup'
import tailwindcss, { type PluginOptions as TailwindOptions } from '@tailwindcss/vite'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import type { PluginOption, ResolvedConfig } from 'vite'
import type { Frontmatter } from '../types.js'
import * as Config from './config.js'
import * as Mdx from './mdx.js'

export const tailwind = tailwindcss as unknown as (opts?: TailwindOptions) => PluginOption

/**
 * Deduplicates dependencies.
 *
 * @returns Plugin.
 */
export function dedupe(): PluginOption {
  return {
    name: 'dedupe',
    config(config) {
      return {
        resolve: {
          ...config?.resolve,
          dedupe: ['react', 'react-dom', 'react-server-dom-webpack'],
        },
      }
    },
  }
}

export function llms(config: Config.Config): PluginOption {
  const { description, title } = config
  let viteConfig: ResolvedConfig

  const { rehypePlugins, remarkPlugins } = Mdx.getCompileOptions('txt', config)

  async function buildLlmsContent() {
    const pagesDir = path.resolve(viteConfig.root, config.srcDir, config.pagesDir)
    const pages = await Array.fromAsync(fs.glob(`${pagesDir}/**/*.{md,mdx}`))

    const results = await Promise.all(
      pages.map(async (page) => {
        const content = await fs.readFile(page, 'utf-8')
        const file = await unified()
          .use(remarkParse)
          .use(remarkMdx)
          .use(remarkStringify)
          .use(remarkPlugins)
          .use(rehypePlugins)
          .process(content)

        // biome-ignore lint/complexity/useLiteralKeys: _
        const { title, description } = file.data['frontmatter'] as Frontmatter
        if (!title) return

        const path = page
          .replace(pagesDir, '')
          .replace(/\.mdx?$/, '')
          .replace(/index$/, '')
        return {
          title,
          description,
          file,
          path,
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

    const short = [...llmsTxtContent]
    for (const { title, description, path } of results)
      short.push(`- [${title}](${path})${description ? `: ${description}` : ''}`)

    const full = [...llmsTxtContent]
    for (const { file } of results) full.push(String(file))

    return { full: full.join('\n'), short: short.join('\n') }
  }

  return {
    name: 'llms',
    enforce: 'post',
    configResolved(config) {
      viteConfig = config
    },
    async configureServer(server) {
      const content = await buildLlmsContent()

      server.middlewares.use((req, res, next) => {
        if (req.url === '/llms.txt') {
          res.setHeader('Content-Type', 'text/plain')
          res.end(content.short)
          return
        }
        if (req.url === '/llms-full.txt') {
          res.setHeader('Content-Type', 'text/plain')
          res.end(content.full)
          return
        }
        next()
      })
    },
    async buildEnd() {
      const content = await buildLlmsContent()
      const outDir = path.resolve(viteConfig.root, config.outDir, 'public')
      await fs.writeFile(path.join(outDir, 'llms-full.txt'), content.full, { encoding: 'utf-8' })
      await fs.writeFile(path.join(outDir, 'llms.txt'), content.short, { encoding: 'utf-8' })
    },
  }
}

/**
 * Processes MDX files.
 *
 * @param config - Vocs configuration.
 * @returns Plugin.
 */
export function mdx(config: Config.Config): PluginOption {
  return mdxPlugin(Mdx.getCompileOptions('react', config))
}

/**
 * Vite plugin that provides the Vocs configuration.
 *
 * @param config - Vocs configuration.
 * @returns Plugin.
 */
export function virtualConfig(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/config'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  return {
    name: 'vocs:virtual-config',
    enforce: 'pre',
    config() {
      Config.setGlobal(config)
    },
    configureServer(server) {
      server.watcher.add('vocs.config.*')
      server.watcher.on('change', async (path) => {
        if (!path.includes('vocs.config')) return

        const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (mod) server.moduleGraph.invalidateModule(mod)

        const config = await Config.resolve()
        server.ws.send('vocs:config', config)
      })
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        let content = ''

        content += `export const config = ${Config.serialize(config)}`

        return content
      }
      return
    },
  }
}
