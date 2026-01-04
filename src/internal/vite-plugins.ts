import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import mdxPlugin from '@mdx-js/rollup'
import tailwindcss, { type PluginOptions as TailwindOptions } from '@tailwindcss/vite'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import type { PluginOption, ResolvedConfig } from 'vite'
import { createLogger } from 'vite'
import * as Config from './config.js'
import * as Langs from './langs.js'
import * as Markdown from './markdown.js'
import * as Mdx from './mdx.js'

export { default as icons } from 'unplugin-icons/vite'

export const tailwind = tailwindcss as unknown as (opts?: TailwindOptions) => PluginOption

const logger = createLogger(undefined, { allowClearScreen: false, prefix: '[vocs]' })

/**
 * Configures dependencies.
 *
 * @returns Plugin.
 */
export function deps(): PluginOption {
  return {
    name: 'vocs:deps',
    config(config) {
      return {
        build: {
          ...config?.build,
          rollupOptions: {
            ...config?.build?.rollupOptions,
            onLog(level, log, handler) {
              if (log.message.includes('Error when using sourcemap for reporting an error')) return
              if (log.code === 'MODULE_LEVEL_DIRECTIVE') return
              handler(level, log)
            },
          },
        },
        resolve: {
          ...config?.resolve,
          dedupe: [
            ...(config?.resolve?.dedupe ?? []),
            'react',
            'react-dom',
            'react-server-dom-webpack',
          ],
        },
      }
    },
  }
}

/**
 * Watches for new languages in markdown files.
 * When a new language is detected, triggers a server restart so Shiki can load the
 * new language highlighter.
 */
export function langWatcher(config: Config.Config): PluginOption {
  const defaultLangs = new Set((config.codeHighlight?.langs as string[]) ?? Langs.defaultLangs)
  const codeBlockRegex = /```(\w+)/g

  return {
    name: 'vocs:lang-watcher',
    async configureServer(server) {
      const userConfig = Config.getConfigFile()
      if (userConfig) {
        const configString = await fs.readFile(userConfig, 'utf-8')
        if (configString.includes('langs:')) return
      }

      const pagesDir = path.resolve(config.rootDir, config.srcDir, config.pagesDir)

      server.watcher.on('change', async (changedPath) => {
        if (!changedPath.startsWith(pagesDir)) return
        if (!changedPath.endsWith('.md') && !changedPath.endsWith('.mdx')) return

        try {
          const content = await fs.readFile(changedPath, 'utf-8')
          let match: RegExpExecArray | null
          // biome-ignore lint/suspicious/noAssignInExpressions: _
          while ((match = codeBlockRegex.exec(content)) !== null) {
            const lang = match[1]?.toLowerCase()
            if (lang && !defaultLangs.has(lang)) {
              defaultLangs.add(lang)
              logger.info(`New language "${lang}" detected, restarting server...`, {
                timestamp: true,
              })
              server.restart()
              return
            }
          }
        } catch {}
      })
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

        const { title, description } = file.data['frontmatter'] as Config.Frontmatter
        if (!title) return

        const path = page
          .replace(pagesDir, '')
          .replace(/\.mdx?$/, '')
          .replace(/\/$/, '')
          .replace(/index$/, '')
        return {
          content: String(file),
          file,
          title,
          description,
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

    const nav = []
    for (const { title, description, path } of results)
      nav.push(
        `- [${title}](${path === '/' ? '/index' : path}.md)${description ? `: ${description}` : ''}`,
      )

    const sitemap = ['<!--', 'Sitemap:', ...nav, '-->', '', ''].join('\n')
    for (const result of results) result.content = sitemap + result.content

    const short = [...llmsTxtContent, ...nav]

    const full = [...llmsTxtContent]
    for (const { content } of results) full.push(content)

    return { full: full.join('\n'), results, short: short.join('\n') }
  }

  return {
    name: 'vocs:llms',
    enforce: 'post',
    configResolved(config) {
      viteConfig = config
    },
    configureServer(server) {
      let content: Awaited<ReturnType<typeof buildLlmsContent>> | undefined
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/llms.txt' || req.url === '/llms-full.txt') {
          content = await buildLlmsContent()
          res.setHeader('Content-Type', 'text/plain')
          res.end(req.url === '/llms.txt' ? content.short : content.full)
          return
        }

        if (req.url?.startsWith('/assets/md/')) {
          content = await buildLlmsContent()
          const pagePath = req.url.slice('/assets/md'.length, -3) || '/'
          const result = content.results.find(
            (r) => r.path.replace(/\/$/, '') === pagePath.replace(/\/index$/, ''),
          )
          if (result) {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.end(result.content)
          }
          return
        }

        {
          const content = await Markdown.fromRequestListener(req, res)
          if (content) {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.end(content)
            return
          }
        }

        next()
      })
    },
    async buildEnd() {
      const content = await buildLlmsContent()
      const outDir = path.resolve(viteConfig.root, config.outDir, 'public')
      await fs.mkdir(outDir, { recursive: true })
      await Promise.all([
        fs.writeFile(path.join(outDir, 'llms-full.txt'), content.full, { encoding: 'utf-8' }),
        fs.writeFile(path.join(outDir, 'llms.txt'), content.short, { encoding: 'utf-8' }),
        ...content.results.map(async ({ content, path: pagePath }) => {
          const mdPath = path.join(
            outDir,
            'assets/md',
            `${pagePath.replace(/^\/$/, 'index').replace(/\/$/, '')}.md`,
          )
          const directory = path.dirname(mdPath)
          await fs.mkdir(directory, { recursive: true })
          return fs.writeFile(mdPath, content, {
            encoding: 'utf-8',
          })
        }),
      ])
    },
  }
}

/**
 * Processes MDX files with graceful error handling.
 *
 * When MDX compilation fails (e.g., malformed JSX), it returns the previous
 * successful result and logs the error to the console instead of breaking the page.
 *
 * @param config - Vocs configuration.
 * @returns Plugin.
 */
export function mdx(config: Config.Config): PluginOption {
  const { checkDeadlinks } = config
  const plugin = mdxPlugin(Mdx.getCompileOptions('react', config))

  let mode: 'development' | 'production' = 'development'

  // TODO: fs cache
  const cache = new Map<
    string,
    { code: string; result: Awaited<ReturnType<typeof plugin.transform>> }
  >()

  return {
    ...plugin,
    name: 'vocs:mdx',
    configResolved(resolvedConfig) {
      mode = resolvedConfig.command === 'build' ? 'production' : 'development'
    },
    async transform(code, id) {
      if (!id.endsWith('.mdx') && !id.endsWith('.md')) return null
      if (!plugin.transform) return null

      const cached = cache.get(id)
      if (cached && cached.code === code) return cached.result

      try {
        const result = await plugin.transform(code, id)
        if (result) cache.set(id, { code, result })
        return result
      } catch (error) {
        // In production, always throw errors
        if (mode === 'production') throw error

        // In dev, use cached result if available
        if (cached) {
          logger.error(`MDX compilation error in ${id}: ${error}`, {
            error: error as Error,
            timestamp: true,
          })
          return cached.result
        }
        throw error
      }
    },
    buildEnd() {
      if (mode !== 'production') return
      if (Mdx.deadLinks.size === 0) return
      if (checkDeadlinks === 'warn' || checkDeadlinks === false) return

      const errors: string[] = []
      for (const [file, links] of Mdx.deadLinks)
        errors.push(`${file}:\n${links.map((link) => `  - ${link}`).join('\n')}`)

      throw new Error(`Found dead links:\n\n${errors.join('\n\n')}`)
    },
  }
}

/**
 * Watches for route files being added or removed.
 * When detected, triggers a server restart so routes are updated.
 */
export function routeWatcher(config: Config.Config): PluginOption {
  const pagesDir = path.resolve(config.rootDir, config.srcDir, config.pagesDir)
  const fileNames = ['_mdx-wrapper.tsx']

  return {
    name: 'vocs:route-watcher',
    configureServer(server) {
      const restart = (filePath: string) => {
        if (!filePath.startsWith(pagesDir)) return
        if (!fileNames.some((fileName) => filePath.endsWith(fileName))) return
        server.restart()
      }

      server.watcher.on('add', restart)
      server.watcher.on('unlink', restart)
    },
  }
}

/**
 * Vite plugin that provides user styles from `_root.css` in the pages directory.
 */
export function userStyles(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/user-styles'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  const stylesPath = path.resolve(config.rootDir, config.srcDir, config.pagesDir, '_root.css')

  return {
    name: 'vocs:user-styles',
    enforce: 'pre',
    async resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        try {
          await fs.access(stylesPath)
          return `import styles from '${stylesPath}?url'; export default styles;`
        } catch {
          return 'export default undefined;'
        }
      }
      return
    },
  }
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
      server.watcher.on('change', async (changedPath) => {
        if (!changedPath.includes('vocs.config')) return

        try {
          const newConfig = await Config.resolve()
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
          if (mod) server.moduleGraph.invalidateModule(mod)
          Config.setGlobal(newConfig)
          server.ws.send({ type: 'custom', event: 'vocs:config', data: newConfig })
        } catch {}
      })
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const currentConfig = Config.getGlobal() ?? config
        return `export const config = ${Config.serialize(currentConfig)}`
      }
      return
    },
  }
}
