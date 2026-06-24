import crypto from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import mdxPlugin from '@mdx-js/rollup'
import tailwindcss, { type PluginOptions as TailwindOptions } from '@tailwindcss/vite'
import type { PluginOption, ResolvedConfig, Rolldown, ViteDevServer } from 'vite'
import { createLogger } from 'vite'
import * as Config from './config.js'
import * as ConfigSerializer from './config-serializer.js'
import * as Git from './git.js'
import * as Icons from './icons.js'
import * as Langs from './langs.js'
import * as Llms from './llms.js'
import * as Mdx from './mdx.js'
import type * as OpenApi from './openapi/index.js'
import * as OpenApiRegistry from './openapi/registry.js'
import { SearchDocuments, SearchIndex } from './search.js'
import * as ShikiTransformers from './shiki-transformers.js'
import * as TaskRunner from './task-runner.js'
import * as InlineCache from './twoslash/inline-cache.js'

export { default as icons } from 'unplugin-icons/vite'
export { default as arraybuffer } from 'vite-plugin-arraybuffer'

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
      const { rollupOptions: _rollupOptions, ...build } = config?.build ?? {}
      return {
        build: {
          ...build,
          chunkSizeWarningLimit: 1000,
          rolldownOptions: {
            ...build.rolldownOptions,
            onLog(level, log, handler) {
              if (log.message.includes('Error when using sourcemap for reporting an error')) return
              if (log.code === 'MODULE_LEVEL_DIRECTIVE') return
              if (log.code === 'EMPTY_BUNDLE') return
              handler(level, log)
            },
          },
        },
        optimizeDeps: {
          ...config?.optimizeDeps,
          include: [
            'vocs > debug',
            'vocs > extend',
            'vocs > @base-ui/react/dialog',
            'vocs > @base-ui/react/menu',
            'vocs > @base-ui/react/navigation-menu',
            'vocs > @base-ui/react/popover',
            'vocs > @base-ui/react/radio',
            'vocs > @base-ui/react/radio-group',
            'vocs > @base-ui/react/tabs',
            'vocs > @iconify/utils',
            'vocs > @jridgewell/resolve-uri',
            'vocs > anser',
            'vocs > cva',
            'vocs > escape-carriage',
            'vocs > lines-and-columns',
            'vocs > lz-string',
            'vocs > react-error-boundary',
            'vocs > ts-interface-checker',
            ...(config?.optimizeDeps?.include ?? []),
          ],
          exclude: [
            'vocs',
            '@takumi-rs/core',
            '@takumi-rs/wasm',
            'rehype-stringify',
            'remark-gfm',
            'remark-parse',
            'remark-rehype',
            'unified',
            'unist-util-visit',
            ...(config?.optimizeDeps?.exclude ?? []),
          ],
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
        ssr: {
          external: ['@takumi-rs/core'],
          noExternal: ['debug', '@takumi-rs/image-response', '@takumi-rs/wasm'],
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
    const pages = await Llms.getPagesFromDir(pagesDir)
    const openapiPages = await Llms.getOpenApiPages(config)
    // Generated OpenAPI pages first so they win over any consumer override at the
    // same generated route (`.md` serves the full reference); authored-only guide
    // pages under the section keep their own content.
    return Llms.buildLlmsContent({
      pages: [...openapiPages, ...pages],
      title,
      description,
      rehypePlugins,
      remarkPlugins,
      sidebar: config.sidebar,
    })
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
  const { checkDeadlinks, twoslash } = config
  const plugin = mdxPlugin(Mdx.getCompileOptions('react', config))

  let mode: 'development' | 'production' = 'development'

  // TODO: fs cache
  const cache = new Map<string, { code: string; result: Rolldown.TransformResult }>()

  const normalizeTransformResult = (
    result: Awaited<ReturnType<typeof plugin.transform>>,
  ): Rolldown.TransformResult => {
    if (result && typeof result === 'object' && 'map' in result && result.map === undefined) {
      const { map: _map, ...rest } = result
      return rest as Rolldown.TransformResult
    }
    return result as Rolldown.TransformResult
  }

  return {
    ...plugin,
    name: 'vocs:mdx',
    configResolved(resolvedConfig) {
      mode = resolvedConfig.command === 'build' ? 'production' : 'development'
    },
    async transform(code, id): Promise<Rolldown.TransformResult> {
      if (!id.endsWith('.mdx') && !id.endsWith('.md')) return null
      if (!plugin.transform) return null

      const cached = cache.get(id)
      if (cached && cached.code === code) return cached.result

      try {
        const result = normalizeTransformResult(await plugin.transform.call(this, code, id))
        // Flush any inline twoslash cache write-backs queued during this
        // file's transform (no-op when the inline cache is disabled).
        InlineCache.flush(id)
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

      // Check for twoslash errors
      if (twoslash && typeof twoslash === 'object' && twoslash.checkOnly)
        ShikiTransformers.checkTwoslashSnippets()
      if (ShikiTransformers.twoslashErrors.length > 0) {
        const errors = ShikiTransformers.twoslashErrors.map((err) => {
          const lines = err.code.split('\n')
          const numberedCode = lines
            .map((line, i) => `  ${String(i + 1).padStart(3)} | ${line}`)
            .join('\n')
          return `[${err.lang}]${err.meta ? ` (${err.meta})` : ''}:\n${err.message}\n\n${numberedCode}`
        })
        throw new Error(
          `[vocs:twoslash] Found ${errors.length} twoslash error(s):\n\n${errors.join('\n\n---\n\n')}`,
        )
      }

      // Check for dead links
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

  async function hasPublicFile(fileName: string): Promise<boolean> {
    if (!viteConfig.publicDir) return false
    try {
      await fs.access(path.join(viteConfig.publicDir, fileName))
      return true
    } catch {
      return false
    }
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
        const pagePath =
          page
            .replace(pagesDir, '')
            .replace(/\.(mdx?|tsx?)$/, '')
            .replace(/\/index$/, '/')
            .replace(/\/$/, '') || '/'

        const loc = `${siteUrl.replace(/\/$/, '')}${pagePath}`
        const gitDate = Git.getLastModified(page)
        const lastmod = gitDate
          ? (gitDate.split('T')[0] as string)
          : ((await fs.stat(page)).mtime.toISOString().split('T')[0] as string)

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

      const writes: Promise<void>[] = []
      if (!(await hasPublicFile('sitemap.xml')))
        writes.push(
          fs.writeFile(path.join(options.dir, 'sitemap.xml'), sitemapContent, {
            encoding: 'utf-8',
          }),
        )
      if (!(await hasPublicFile('robots.txt')))
        writes.push(
          fs.writeFile(path.join(options.dir, 'robots.txt'), buildRobotsTxt(siteUrl), {
            encoding: 'utf-8',
          }),
        )
      await Promise.all(writes)
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
 * Supports both `?url` (external file) and `?inline` (inlined CSS string) modes.
 */
export function userStyles(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/user-styles'
  const virtualModuleIdInline = 'virtual:vocs/user-styles?inline'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  const resolvedVirtualModuleIdInline = `\0${virtualModuleIdInline}`
  const stylesPath = path.resolve(config.rootDir, config.srcDir, config.pagesDir, '_root.css')

  return {
    name: 'vocs:user-styles',
    enforce: 'pre',
    async resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      if (id === virtualModuleIdInline) return resolvedVirtualModuleIdInline
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
      if (id === resolvedVirtualModuleIdInline) {
        try {
          await fs.access(stylesPath)
          return `import styles from '${stylesPath}?inline'; export default styles;`
        } catch {
          return 'export default undefined;'
        }
      }
      return
    },
  }
}

/**
 * Vite plugin that loads user slot components from `_slots.tsx`.
 *
 * Users can export `Footer`, `OutlineFooter`, `SidebarHeader` components
 * that will be injected into the layout.
 */
export function slots(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/slots'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  const slotsPath = path.resolve(config.rootDir, config.srcDir, config.pagesDir, '_slots.tsx')

  return {
    name: 'vocs:slots',
    enforce: 'pre',
    async resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        try {
          await fs.access(slotsPath)
          return `
import * as Slots from '${slotsPath}'
export const Footer = Slots.Footer ?? undefined
export const OutlineFooter = Slots.OutlineFooter ?? undefined
export const SidebarHeader = Slots.SidebarHeader ?? undefined
`
        } catch {
          return 'export const Footer = undefined; export const OutlineFooter = undefined; export const SidebarHeader = undefined;'
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
  let indexUpdatePromise = Promise.resolve()
  let indexUpdateTimer: ReturnType<typeof setTimeout> | undefined
  const pendingIndexUpdateFiles = new Set<string>()

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

  function updateIndex(file: string): void {
    indexUpdatePromise = indexUpdatePromise
      .then(async () => {
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
      })
      .catch((error) => {
        logger.error(
          `Failed to update search index: ${error instanceof Error ? error.message : String(error)}`,
        )
      })
  }

  function scheduleIndexUpdate(file: string): void {
    pendingIndexUpdateFiles.add(file)
    if (indexUpdateTimer) clearTimeout(indexUpdateTimer)
    indexUpdateTimer = setTimeout(() => {
      indexUpdateTimer = undefined
      const files = [...pendingIndexUpdateFiles]
      pendingIndexUpdateFiles.clear()
      for (const file of files) updateIndex(file)
    }, 250)
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
    handleHotUpdate({ file }) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) return
      if (!file.startsWith(pagesDirPath)) return

      scheduleIndexUpdate(file)
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
        const currentConfig = OpenApiRegistry.mergeSidebar(Config.getGlobal() ?? config)
        const serializedConfig =
          mode === 'development' ? { ...currentConfig, baseUrl: undefined } : currentConfig
        return `export const config = ${ConfigSerializer.serialize(serializedConfig)}`
      }
      return
    },
  }
}

/**
 * Vite plugin that provides extra language registrations from twoslash transformers.
 *
 * Creates a virtual module `virtual:vocs/langs` that exports language registrations
 * from twoslash transformers (e.g., rust/toml from experimental_rust).
 *
 * @param config - Vocs configuration.
 * @returns Plugin.
 */
export function virtualLangs(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/langs'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'vocs:virtual-langs',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const twoslash = config.twoslash
        const transformers =
          twoslash && typeof twoslash === 'object' ? twoslash.transformers : undefined

        if (!transformers?.length) {
          return 'export const langs = []'
        }

        const langIds = new Set<string>()

        for (let i = 0; i < transformers.length; i++) {
          const t = transformers[i]
          if (t && 'langs' in t && Array.isArray(t.langs) && t.langs.length > 0) {
            for (const lang of t.langs) {
              if (lang.name) langIds.add(lang.name)
            }
          }
        }

        if (!langIds.size) {
          return 'export const langs = []'
        }

        const imports: string[] = []
        const langExports: string[] = []
        let index = 0
        for (const langId of langIds) {
          const importName = `lang${index++}`
          imports.push(`import ${importName} from 'shiki/langs/${langId}.mjs'`)
          langExports.push(`...${importName}`)
        }

        return `${imports.join('\n')}\nexport const langs = [${langExports.join(', ')}]`
      }
      return
    },
  }
}

/**
 * Vite plugin that generates CSS for code block icons.
 *
 * Scans markdown files for `[label]` syntax and generates CSS
 * with icon backgrounds based on builtin and custom icon mappings.
 *
 * Based on vitepress-plugin-group-icons by @yuyinws
 * @see https://github.com/yuyinws/vitepress-plugin-group-icons
 */
export function groupIcons(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/group-icons.css'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  const { rootDir, srcDir, pagesDir } = config
  const pagesDirPath = path.resolve(rootDir, srcDir, pagesDir)

  const labelRegex = /\[(.*?)\]/g
  const labels = new Set<string>()
  let cachedCss = ''
  let server: ViteDevServer | undefined

  function invalidateModule(): void {
    if (!server) return
    const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
    if (!mod) return
    server.moduleGraph.invalidateModule(mod)
    server.reloadModule(mod)
  }

  function matchIconForLabel(label: string): string | undefined {
    const namedMatch = label.match(/\s~([^~]+)~/)
    if (namedMatch?.[1]) return namedMatch[1]
    return Icons.matchIcon(label, config.groupIcons?.customIcons)
  }

  function svgToDataUri(svg: string): string {
    const encoded = svg
      .replace(/currentColor/g, '#888888')
      .replace(/"/g, "'")
      .replace(/%/g, '%25')
      .replace(/#/g, '%23')
      .replace(/{/g, '%7B')
      .replace(/}/g, '%7D')
      .replace(/</g, '%3C')
      .replace(/>/g, '%3E')
    return `url("data:image/svg+xml,${encoded}")`
  }

  function cssToDataUrl(css: string): string {
    return `data:text/css;charset=utf-8,${encodeURIComponent(css)}`
  }

  function cssAssetFileName(css: string): string {
    const hash = crypto.createHash('md5').update(css).digest('hex').slice(0, 12)
    return `vocs-group-icons-${hash}.css`
  }

  function cssAssetUrl(css: string): string {
    return `${config.basePath.endsWith('/') ? config.basePath : `${config.basePath}/`}assets/${cssAssetFileName(css)}`
  }

  async function scanLabels(): Promise<void> {
    const files = await Array.fromAsync(fs.glob(`${pagesDirPath}/**/*.{md,mdx}`))
    labels.clear()

    await Promise.all(
      files.map(async (file) => {
        try {
          const content = await fs.readFile(file, 'utf-8')
          let match: RegExpExecArray | null
          // biome-ignore lint/suspicious/noAssignInExpressions: _
          while ((match = labelRegex.exec(content)) !== null) {
            const label = match[1]
            if (label) labels.add(label)
          }
        } catch {}
      }),
    )
  }

  async function buildCss(): Promise<string> {
    const iconGroups = new Map<string, string[]>()

    for (const label of [...labels].sort()) {
      const icon = matchIconForLabel(label)
      if (!icon) continue

      const existing = iconGroups.get(icon) ?? []
      existing.push(label)
      iconGroups.set(icon, existing)
    }

    const cssRules: string[] = []

    for (const [icon, iconLabels] of [...iconGroups].sort(([iconA], [iconB]) =>
      iconA.localeCompare(iconB),
    )) {
      const svg = await Icons.resolveIcon(icon)
      if (!svg) continue

      const selectors = iconLabels
        .flatMap((label) => {
          const escaped = label.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
          return [
            `[data-v-code-group-tab][data-title="${escaped}"]::before`,
            `[data-v-code-title][data-title="${escaped}"]::before`,
          ]
        })
        .join(',\n')

      cssRules.push(`${selectors} {
  content: '';
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-right: 0.5em;
  vertical-align: text-bottom;
  background: ${svgToDataUri(svg)} no-repeat center;
  background-size: contain;
}`)
    }

    return cssRules.join('\n\n')
  }

  return {
    name: 'vocs:group-icons',
    enforce: 'pre',

    async configureServer(devServer) {
      server = devServer
      await scanLabels()
      cachedCss = await buildCss()

      devServer.watcher.on('change', async (changedPath) => {
        if (!changedPath.startsWith(pagesDirPath)) return
        if (!changedPath.endsWith('.md') && !changedPath.endsWith('.mdx')) return

        const previousSize = labels.size
        await scanLabels()

        if (labels.size !== previousSize) {
          cachedCss = await buildCss()
          invalidateModule()
          logger.info('Group icons CSS updated', { timestamp: true })
        }
      })
    },

    resolveId(id) {
      if (
        id === virtualModuleId ||
        id === `${virtualModuleId}?inline` ||
        id === `${virtualModuleId}?url`
      )
        return id === virtualModuleId
          ? resolvedVirtualModuleId
          : id === `${virtualModuleId}?inline`
            ? `${resolvedVirtualModuleId}?inline`
            : `${resolvedVirtualModuleId}?url`
      return
    },

    async load(id) {
      const isUrl = id === `${resolvedVirtualModuleId}?url`
      if (id !== resolvedVirtualModuleId && id !== `${resolvedVirtualModuleId}?inline` && !isUrl)
        return

      if (!cachedCss && labels.size === 0) {
        await scanLabels()
        cachedCss = await buildCss()
      }

      if (isUrl) {
        if (!cachedCss) return 'export default undefined'
        if (server) return `export default ${JSON.stringify(cssToDataUrl(cachedCss))}`
        return `export default ${JSON.stringify(cssAssetUrl(cachedCss))}`
      }

      return cachedCss
    },

    generateBundle() {
      if (!cachedCss) return
      this.emitFile({
        type: 'asset',
        fileName: `assets/${cssAssetFileName(cachedCss)}`,
        source: cachedCss,
      })
    },

    async buildStart() {
      if (server) return
      await scanLabels()
      cachedCss = await buildCss()
    },
  }
}

/**
 * Vite plugin that provides file tree icons as a virtual module.
 *
 * Uses the same icon resolution as groupIcons, supporting both builtin
 * and custom icon mappings from config.groupIcons.customIcons.
 */
export function fileTreeIcons(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/file-tree-icons'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  const customIcons = config.groupIcons?.customIcons

  return {
    name: 'vocs:file-tree-icons',
    enforce: 'pre',

    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },

    async load(id) {
      if (id !== resolvedVirtualModuleId) return

      return `
import * as Icons from './icons.js'

const customIcons = ${JSON.stringify(customIcons ?? {})}

export async function getFileIconSvg(filename) {
  const icon = Icons.matchIcon(filename, customIcons)
  if (!icon) return undefined
  return Icons.resolveIcon(icon)
}

export { matchIcon, resolveIcon, resolveIconSync } from './icons.js'
`
    },
  }
}

/**
 * Vite plugin that parses configured OpenAPI specs and exposes them as a
 * virtual module (`virtual:vocs/openapi`).
 *
 * The module exports `specs`, a map of mount path to parsed
 * {@link OpenApi.Ir | intermediate representation}, consumed by the OpenAPI
 * route component and sidebar generator.
 *
 * Local spec files are watched in dev: changes invalidate the module and
 * trigger a full reload so the section regenerates.
 */
export function openapi(config: Config.Config): PluginOption {
  const virtualModuleId = 'virtual:vocs/openapi'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  /** Resolve absolute paths of local file specs for dev watching. */
  function specFilePaths(currentConfig: Config.Config): string[] {
    const paths: string[] = []
    for (const entry of currentConfig.openapi ?? []) {
      const { spec } = entry
      if (typeof spec !== 'string') continue
      if (spec.startsWith('http://') || spec.startsWith('https://')) continue
      paths.push(path.isAbsolute(spec) ? spec : path.resolve(currentConfig.rootDir, spec))
    }
    return paths
  }

  return {
    name: 'vocs:openapi',
    enforce: 'pre',
    async buildStart() {
      // Parse specs up front so generated sidebars are available when the
      // `virtual:vocs/config` module is serialized.
      try {
        await OpenApiRegistry.build(Config.getGlobal() ?? config)
      } catch (error) {
        this.error(
          `Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    configureServer(server) {
      server.watcher.on('change', async (changedPath) => {
        const currentConfig = Config.getGlobal() ?? config
        if (!specFilePaths(currentConfig).includes(changedPath)) return

        // Re-parse before reloading so the new sidebar + page are ready.
        OpenApiRegistry.invalidate()
        try {
          await OpenApiRegistry.build(currentConfig)
        } catch {}

        for (const moduleId of [resolvedVirtualModuleId, '\0virtual:vocs/config']) {
          const mod = server.moduleGraph.getModuleById(moduleId)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload' })
      })
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return

      const currentConfig = Config.getGlobal() ?? config

      // Watch local spec files so the build re-runs when they change.
      for (const filePath of specFilePaths(currentConfig)) this.addWatchFile(filePath)

      let specs: Record<string, OpenApi.Ir> = {}
      try {
        specs = await OpenApiRegistry.build(currentConfig)
      } catch (error) {
        this.error(
          `Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`,
        )
      }

      return `export const specs = ${JSON.stringify(specs)}`
    },
  }
}
