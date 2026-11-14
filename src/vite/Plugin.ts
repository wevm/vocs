/**
 * The `vocs()` Vite plugin. It serves `virtual:vocs/config`, the site config with its sources
 * built. The build reads every snapshot source once and writes the files as one
 * content-addressed static asset that the page loads on the first question, so the server
 * bundle carries only its URL. With `twoslash` set, it also serves the type snapshot as
 * `virtual:vocs/types`, a server module that the handler imports on the first Twoslash block.
 * With `demos` set, it serves the registry as `virtual:vocs/demos`, and the client build emits
 * `virtual:vocs/islands`, the module that hydrates the demos of a permalink. The client then
 * builds before the server, which reads the URL of that module from Vite's cache directory.
 * In dev, the dev server serves the sources asset, and a change to the config or a Markdown file
 * rebuilds it and reloads the config.
 * @module
 */
import * as Fs from 'node:fs/promises'
import * as Path from 'node:path'
import { type Plugin, runnerImport } from 'vite'
import type * as Config from '../Config.js'
import * as Corpus from '../internal/Corpus.js'
import * as Demos from '../internal/Demos.js'
import * as Highlight from '../internal/Highlight.js'
import * as NodeFiles from '../internal/NodeFiles.js'
import * as Types from '../internal/Types.js'

const id = 'virtual:vocs/config'
const demosId = 'virtual:vocs/demos'
const islandsId = 'virtual:vocs/islands'
const typesId = 'virtual:vocs/types'
const virtuals = [id, demosId, islandsId, typesId]

/**
 * Rewrites `__filename` in TypeScript's API module. TypeScript treats a bundle with a `require`
 * shim and a `process` global, such as a Worker, as Node, and then reads `__filename`, which a
 * bundle does not define.
 */
const typescript = {
  name: 'vocs:typescript',
  transform: {
    filter: { id: /[\\/]typescript[\\/]lib[\\/]typescript\.js$/ },
    handler(code: string) {
      return { code: code.replaceAll('__filename', '"/typescript.js"'), map: null }
    },
  },
}

/**
 * Builds the config's sources and exposes the config to the app.
 *
 * @example
 * ```ts
 * import { vocs } from 'vocs/vite'
 *
 * export default defineConfig({ plugins: [vocs()] })
 * ```
 */
export function vocs(options: vocs.Options = {}): Plugin {
  let root = process.cwd()
  let base = '/'
  let assetsDir = 'assets'
  let cacheDir = 'node_modules/.vite'
  let command: 'build' | 'serve' = 'serve'
  let preamble = false
  /** Reference to the islands chunk of the client build. */
  let islandsChunk: string | undefined
  let imported: Promise<Config.Config> | undefined
  let corpus: Promise<Corpus.Corpus> | undefined
  let types: Promise<Types.Snapshot> | undefined

  const configPath = () => Path.resolve(root, options.config ?? 'vocs.config.ts')
  const fileName = (hash: string) => `${assetsDir}/vocs-corpus-${hash}.json`
  // Each environment of a build has its own plugin instance, so the client build hands the URL of
  // the islands chunk to the server build through this file.
  const islandsFile = () => Path.join(cacheDir, 'vocs-islands.json')

  function load() {
    imported ??= runnerImport<{ default: Config.Config }>(configPath()).then(
      (result) => result.module.default,
    )
    return imported
  }

  function build() {
    corpus ??= load().then((config) =>
      Corpus.build({ config, context: { env: process.env, files: NodeFiles.create(root) } }),
    )
    return corpus
  }

  /** Returns the demo module paths by name, resolved against the config file. */
  async function demos() {
    const config = await load()
    return Object.entries(config.demos ?? {}).map(([name, demo]) => {
      const path = typeof demo === 'string' ? demo : demo.module
      return [name, Path.resolve(Path.dirname(configPath()), path)] as const
    })
  }

  function snapshot() {
    types ??= load().then((config) =>
      Types.snapshot({ packages: config.twoslash?.packages ?? [], root }),
    )
    return types
  }

  return {
    buildApp: {
      // Server builds, such as the Cloudflare plugin's Worker, read the URL of the islands chunk.
      order: 'pre',
      async handler(builder) {
        const client = builder.environments.client
        if (client && !client.isBuilt && (await demos()).length > 0) await builder.build(client)
      },
    },
    async buildStart() {
      if (command !== 'build' || this.environment.config.consumer !== 'client') return
      if ((await demos()).length === 0) return
      await Fs.rm(islandsFile(), { force: true })
      islandsChunk = this.emitFile({ id: islandsId, name: 'vocs-islands', type: 'chunk' })
    },
    config() {
      // The agent module imports its WebAssembly through `?url`, which prebundling skips. Its
      // dependencies are prebundled up front, so the first question does not reload the page.
      return {
        optimizeDeps: {
          exclude: ['@sqlite.org/sqlite-wasm', 'vocs'],
          include: ['vocs > nanocode-ts', 'vocs > nanocode-ts/bash', 'vocs > xstate'],
        },
      }
    },
    configEnvironment(name, config) {
      // In dev, server environments prebundle TypeScript, so the rewrite runs in the optimizer.
      if (name === 'client' || config.consumer === 'client') return undefined
      return { optimizeDeps: { rolldownOptions: { plugins: [typescript] } } }
    },
    configResolved(config) {
      root = config.root
      base = config.base
      assetsDir = config.build.assetsDir
      cacheDir = config.cacheDir
      command = config.command
      // Demo modules carry React Refresh code in dev, which throws without its preamble.
      preamble = config.plugins.some((plugin) => plugin.name === 'vite:react-virtual-preamble')
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const prefix = `${base}${assetsDir}/vocs-corpus-`
        if (!request.url?.startsWith(prefix)) return next()
        try {
          const built = await build()
          if (request.url !== `${base}${fileName(built.hash)}`) return next()
          response.setHeader('content-type', 'application/json')
          response.end(JSON.stringify(built))
        } catch (error) {
          next(error)
        }
      })
    },
    async generateBundle(_, bundle) {
      if (this.environment.config.consumer !== 'client') return
      if (islandsChunk) {
        await Fs.mkdir(cacheDir, { recursive: true })
        // Every module the islands chunk imports statically, so none waits for its importer.
        const imports = new Set<string>()
        const visit = (file: string) => {
          const chunk = bundle[file]
          if (chunk?.type !== 'chunk') return
          for (const imported of chunk.imports) {
            if (imports.has(imported)) continue
            imports.add(imported)
            visit(imported)
          }
        }
        visit(this.getFileName(islandsChunk))
        await Fs.writeFile(
          islandsFile(),
          JSON.stringify({
            preload: [...imports].map((file) => `${base}${file}`),
            script: `${base}${this.getFileName(islandsChunk)}`,
          } satisfies Omit<Demos.Registry, 'load'>),
        )
      }
      const built = await build()
      this.emitFile({
        fileName: fileName(built.hash),
        source: JSON.stringify(built),
        type: 'asset',
      })
    },
    hotUpdate(update) {
      const changed = update.file === configPath() || /\.mdx?$/.test(update.file)
      if (!changed) return
      corpus = undefined
      if (update.file === configPath()) {
        imported = undefined
        types = undefined
      }
      for (const virtual of virtuals) {
        const module = this.environment.moduleGraph.getModuleById(`\0${virtual}`)
        if (module) this.environment.moduleGraph.invalidateModule(module)
      }
    },
    async load(resolved) {
      // The snapshot is one large string, which the handler parses on its first Twoslash block.
      if (resolved === `\0${typesId}`)
        return `export default JSON.parse(${JSON.stringify(JSON.stringify(await snapshot()))})`
      if (resolved === `\0${demosId}`) {
        const entries = await demos()
        if (entries.length === 0) return 'export const load = {}\nexport default {}'
        return [
          `import { lazy } from 'react'`,
          `export const load = { ${entries.map(([name, path]) => `${JSON.stringify(name)}: () => import(${JSON.stringify(path)})`).join(', ')} }`,
          'export default Object.fromEntries(Object.entries(load).map(([name, load]) => [name, lazy(load)]))',
        ].join('\n')
      }
      if (resolved === `\0${islandsId}`) return islands(command === 'serve' && preamble)
      if (resolved !== `\0${id}`) return undefined
      const [built, config, entries] = await Promise.all([build(), load(), demos()])
      const asset = {
        hash: built.hash,
        url: `${base}${fileName(built.hash)}`,
      } satisfies Corpus.Asset
      // The type snapshot is a separate module, imported on the first Twoslash block.
      const types = config.twoslash
        ? `, [Symbol.for(${JSON.stringify(Highlight.typesKey.description)})]: () => import(${JSON.stringify(typesId)}).then((module) => module.default)`
        : ''
      const modules = await (async (): Promise<Omit<Demos.Registry, 'load'> | undefined> => {
        if (entries.length === 0) return undefined
        if (command === 'serve') return { preload: [], script: `${base}@id/__x00__${islandsId}` }
        if (this.environment.config.consumer === 'client') return { preload: [], script: '' }
        const built = await Fs.readFile(islandsFile(), 'utf8').catch(() => undefined)
        if (built !== undefined) return JSON.parse(built) as Omit<Demos.Registry, 'load'>
        return this.error(
          'The islands module of `demos` is not built. Build the client environment before the server environments.',
        )
      })()
      const registry =
        modules === undefined
          ? ''
          : `, [Symbol.for(${JSON.stringify(Demos.key.description)})]: { ...${JSON.stringify(modules)}, load: () => import(${JSON.stringify(demosId)}).then((module) => module.load) }`
      return [
        `import config from ${JSON.stringify(configPath())}`,
        `export default { ...config, [Symbol.for(${JSON.stringify(Corpus.key.description)})]: ${JSON.stringify(asset)}${types}${registry} }`,
      ].join('\n')
    },
    name: 'vocs',
    transform: {
      filter: typescript.transform.filter,
      handler(code) {
        if (this.environment.config.consumer === 'client') return undefined
        return typescript.transform.handler(code)
      },
    },
    resolveId(source) {
      if (virtuals.includes(source)) return `\0${source}`
      return undefined
    },
  }
}

/**
 * Returns the islands module. It imports the demos of the page in parallel, then hydrates the
 * server HTML with the props of each island, or renders a demo whose server render failed. `Ready` renders no element, so the
 * hydrated tree matches the server HTML, and marks the island `hydrated` once React runs it.
 */
function islands(preamble: boolean) {
  return [
    ...(preamble ? [`import '@vitejs/plugin-react/preamble'`] : []),
    `import { createElement, useEffect } from 'react'`,
    `import { createRoot, hydrateRoot } from 'react-dom/client'`,
    `import { load } from ${JSON.stringify(demosId)}`,
    'function Ready(props) {',
    `  useEffect(() => props.root.setAttribute('data-state', 'hydrated'), [props.root])`,
    '  return props.children',
    '}',
    `const roots = document.querySelectorAll('[data-vocs-part="island"]')`,
    'await Promise.all(Array.from(roots, async (root) => {',
    `  const name = root.getAttribute('data-name')`,
    '  if (!Object.hasOwn(load, name)) return',
    '  const Demo = (await load[name]()).default',
    `  const props = JSON.parse(root.getAttribute('data-props') ?? '{}')`,
    '  const element = createElement(Ready, { root }, createElement(Demo, props))',
    `  if (root.getAttribute('data-state') === 'static') hydrateRoot(root, element)`,
    '  else createRoot(root).render(element)',
    '}))',
  ].join('\n')
}

export declare namespace vocs {
  type Options = {
    /** Config file path, relative to the Vite root. Defaults to `vocs.config.ts`. */
    config?: string | undefined
  }
}
