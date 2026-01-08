import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import mdxPlugin from '@mdx-js/rollup'
import tailwindcss, { type PluginOptions as TailwindOptions } from '@tailwindcss/vite'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import type { PluginOption, ResolvedConfig, ViteDevServer } from 'vite'
import { createLogger } from 'vite'
import * as Config from './config.js'
import * as ConfigSerializer from './config-serializer.js'
import * as Langs from './langs.js'
import * as Mdx from './mdx.js'
import { SearchDocuments, SearchIndex } from './search.js'
import * as TaskRunner from './task-runner.js'

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
        optimizeDeps: {
          ...config?.optimizeDeps,
          include: [
            '@base-ui/react/dialog',
            '@base-ui/react/menu',
            '@base-ui/react/navigation-menu',
            '@base-ui/react/popover',
            '@base-ui/react/radio',
            '@base-ui/react/radio-group',
            '@base-ui/react/tabs',
            '@jridgewell/resolve-uri',
            'anser',
            'cva',
            'escape-carriage',
            'lines-and-columns',
            'lz-string',
            'react-error-boundary',
            'ts-interface-checker',
            ...(config?.optimizeDeps?.include ?? []),
          ],
          exclude: ['vocs', ...(config?.optimizeDeps?.exclude ?? [])],
        },
        resolve: {
          ...config?.resolve,
          alias: [
            ...(Array.isArray(config?.resolve?.alias)
              ? config.resolve.alias
              : config?.resolve?.alias
                ? Object.entries(config.resolve.alias).map(([find, replacement]) => ({
                    find,
                    replacement,
                  }))
                : []),
            {
              find: /^use-sync-external-store\/shim\/with-selector$/,
              replacement: 'use-sync-external-store/shim/with-selector.js',
            },
            {
              find: /^use-sync-external-store\/shim$/,
              replacement: 'use-sync-external-store/shim/index.js',
            },
          ],
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
        `- [${title}](${path === '/' ? '/index' : path})${description ? `: ${description}` : ''}`,
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
 * Generates sitemap.xml and robots.txt for the documentation site.
 *
 * Scans all pages and generates a sitemap.xml with URLs for each page.
 * Also generates a robots.txt that allows all crawlers and references the sitemap.
 * Requires `baseUrl` to be configured for absolute URLs in production.
 *
 * @param config - Vocs configuration.
 * @returns Plugin.
 */
export function sitemap(config: Config.Config): PluginOption {
  const { baseUrl } = config

  let built = false
  let viteConfig: ResolvedConfig

  function getSiteUrl(): string | null {
    return baseUrl ?? (viteConfig.command === 'serve' ? 'http://localhost:5173' : null)
  }

  function buildRobotsTxt(siteUrl: string): string {
    return [
      'User-agent: *',
      'Allow: /',
      '',
      `Sitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml`,
      '',
    ].join('\n')
  }

  async function buildSitemapContent(): Promise<string | null> {
    const siteUrl = getSiteUrl()
    if (!siteUrl) {
      logger.warn('Sitemap generation skipped: baseUrl is not configured', { timestamp: true })
      return null
    }

    const pagesDir = path.resolve(viteConfig.root, config.srcDir, config.pagesDir)
    const pages = await Array.fromAsync(fs.glob(`${pagesDir}/**/*.{md,mdx,tsx}`))

    const runner = TaskRunner.create(20)

    const urls: { loc: string; lastmod: string }[] = []
    for (const page of pages) {
      // Skip files/directories starting with _
      if (
        page
          .replace(pagesDir, '')
          .split('/')
          .some((part) => part.startsWith('_'))
      )
        continue

      runner.run(async () => {
        const stat = await fs.stat(page)
        const pagePath =
          page
            .replace(pagesDir, '')
            .replace(/\.(mdx?|tsx?)$/, '')
            .replace(/\/index$/, '/')
            .replace(/\/$/, '') || '/'

        const loc = `${siteUrl.replace(/\/$/, '')}${pagePath}`
        const lastmod = stat.mtime.toISOString().split('T')[0] as string

        urls.push({ loc, lastmod })
      })
    }

    await runner.wait()

    urls.sort((a, b) => a.loc.localeCompare(b.loc))

    const indent = '  '
    const entries = urls
      .map(({ loc, lastmod }) =>
        [
          `${indent}<url>`,
          `${indent}${indent}<loc>${loc}</loc>`,
          `${indent}${indent}<lastmod>${lastmod}</lastmod>`,
          `${indent}</url>`,
        ].join('\n'),
      )
      .join('\n')

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      entries,
      '</urlset>',
      '',
    ].join('\n')
  }

  return {
    name: 'vocs:sitemap',
    enforce: 'post',
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const siteUrl = getSiteUrl()

        if (req.url === '/robots.txt') {
          if (!siteUrl) {
            res.statusCode = 404
            res.end('robots.txt not available: baseUrl is not configured')
            return
          }
          res.setHeader('Content-Type', 'text/plain')
          res.end(buildRobotsTxt(siteUrl))
          return
        }

        if (req.url === '/sitemap.xml') {
          const content = await buildSitemapContent()
          if (!content) {
            res.statusCode = 404
            res.end('Sitemap not available: baseUrl is not configured')
            return
          }
          res.setHeader('Content-Type', 'application/xml')
          res.end(content)
          return
        }

        next()
      })
    },
    async writeBundle(options) {
      if (!options.dir?.endsWith('/public')) return
      if (built) return
      built = true

      const siteUrl = getSiteUrl()
      const sitemapContent = await buildSitemapContent()
      if (!sitemapContent || !siteUrl) return

      await Promise.all([
        fs.writeFile(path.join(options.dir, 'sitemap.xml'), sitemapContent, { encoding: 'utf-8' }),
        fs.writeFile(path.join(options.dir, 'robots.txt'), buildRobotsTxt(siteUrl), {
          encoding: 'utf-8',
        }),
      ])
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
 * Vite plugin that builds and serves the search index.
 *
 * - Dev: builds index on start, updates on HMR, serves via virtual module
 * - Build: builds index, writes to `.vocs/search-index-{hash}.json`
 */
export function search(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/search-index'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  const { rootDir, srcDir, pagesDir, basePath } = config
  const pagesDirPath = path.resolve(rootDir, srcDir, pagesDir)

  let indexPromise: Promise<SearchIndex.SearchIndex> | undefined
  let indexHash: string | undefined
  let server: ViteDevServer | undefined
  let mode: 'development' | 'production' = 'development'
  const fileIds = new Map<string, string[]>()

  async function buildIndex(): Promise<SearchIndex.SearchIndex> {
    logger.info('Building search index...', { timestamp: true })
    const docs = await SearchDocuments.fromConfig(config)
    const index = SearchIndex.fromSearchDocuments(docs)

    // Populate fileIds map for HMR
    for (const doc of docs) {
      const filePath = doc.id.split('#')[0]
      if (!filePath) continue
      const ids = fileIds.get(filePath) ?? []
      ids.push(doc.id)
      fileIds.set(filePath, ids)
    }

    logger.info('Search index built.', { timestamp: true })
    return index
  }

  function invalidateModule(): void {
    if (!server) return
    const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
    if (!mod) return
    server.moduleGraph.invalidateModule(mod)
    server.ws.send({
      type: 'update',
      updates: [{ acceptedPath: mod.url, path: mod.url, timestamp: Date.now(), type: 'js-update' }],
    })
  }

  return {
    name: 'vocs:search',
    config() {
      return {
        optimizeDeps: {
          include: ['vocs > minisearch'],
        },
      }
    },
    configResolved(resolvedConfig) {
      mode = resolvedConfig.command === 'build' ? 'production' : 'development'
    },
    buildStart() {
      // Only build index in production (dev builds in configureServer to avoid dep optimization issues)
      // Also skip if already built (multi-environment builds call this multiple times)
      if (mode !== 'production' || indexPromise) return
      indexPromise = buildIndex()
    },
    configureServer(devServer) {
      server = devServer
      // Build index in dev after server is ready (avoids dep optimization worker issues)
      indexPromise = buildIndex().then((index) => {
        invalidateModule()
        return index
      })
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return

      const index = await indexPromise

      if (mode === 'development') {
        const json = index ? JSON.stringify(index.toJSON()) : '{}'
        return `export const getSearchIndex = async () => ${JSON.stringify(json)}`
      }

      // Production: return fetch-based loader
      return `export const getSearchIndex = async () => JSON.stringify(await (await fetch("${basePath.endsWith('/') ? basePath : basePath + '/'}assets/search-index-${indexHash}.json")).json())`
    },
    async writeBundle(options) {
      const index = await indexPromise
      if (!index) return
      const outDir = options.dir ?? path.resolve(rootDir, config.outDir)
      indexHash = SearchIndex.saveToFile(index, path.resolve(outDir, 'assets'))
    },
    async handleHotUpdate({ file }) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) return
      if (!file.startsWith(pagesDirPath)) return

      const index = await indexPromise
      if (!index) return

      const previousIds = fileIds.get(file) ?? []
      const newIds = SearchIndex.updateFile(index, file, {
        pagesDir: pagesDirPath,
        config,
        previousIds,
      })
      fileIds.set(file, newIds)

      invalidateModule()
      logger.info(`Search index updated: ${path.relative(rootDir, file)}`, { timestamp: true })
    },
  }
}

/**
 * Vite plugin that provides the Vocs configuration as a virtual module and
 * serializes it to a JSON file at build time.
 *
 * The JSON file is written to `dist/server/assets/vocs.config.json` and is used by
 * `Config.resolve` in production instead of dynamically loading the config file.
 *
 * @param config - Vocs configuration.
 * @returns Plugin.
 */
export function virtualConfig(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/config'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  let mode: 'development' | 'production' = 'development'

  return {
    name: 'vocs:virtual-config',
    enforce: 'pre',
    config() {
      Config.setGlobal(config)
    },
    configResolved(resolvedConfig) {
      mode = resolvedConfig.command === 'build' ? 'production' : 'development'
    },
    async configureServer(server) {
      server.watcher.on('change', async (changedPath) => {
        if (!changedPath.includes('vocs.config')) return

        try {
          const newConfig = await Config.resolve()
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
          if (mod) server.moduleGraph.invalidateModule(mod)
          Config.setGlobal(newConfig)
          server.ws.send({ type: 'custom', event: 'vocs:config', data: newConfig })
          // Force full reload to ensure CSS is properly reprocessed
          server.ws.send({ type: 'full-reload' })
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
        const serializedConfig =
          mode === 'development' ? { ...currentConfig, baseUrl: undefined } : currentConfig
        return `export const config = ${ConfigSerializer.serialize(serializedConfig)}`
      }
      return
    },
  }
}
