/**
 * The `vocs()` Vite plugin. It serves `virtual:vocs/config`, the site config with its sources
 * built. The build reads every snapshot source once and writes the files as one
 * content-addressed static asset that the page loads on the first question, so the server
 * bundle carries only its URL. With `twoslash` set, it also serves the type snapshot as
 * `virtual:vocs/types`, a server module that the handler imports on the first Twoslash block.
 * In dev, the dev server serves the sources asset, and a change to the config or a Markdown file
 * rebuilds it and reloads the config.
 * @module
 */
import * as Path from 'node:path'
import { type Plugin, runnerImport } from 'vite'
import type * as Config from '../Config.js'
import * as Corpus from '../internal/Corpus.js'
import * as Highlight from '../internal/Highlight.js'
import * as NodeFiles from '../internal/NodeFiles.js'
import * as Types from '../internal/Types.js'

const id = 'virtual:vocs/config'
const typesId = 'virtual:vocs/types'

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
  let imported: Promise<Config.Config> | undefined
  let corpus: Promise<Corpus.Corpus> | undefined
  let types: Promise<Types.Snapshot> | undefined

  const configPath = () => Path.resolve(root, options.config ?? 'vocs.config.ts')
  const fileName = (hash: string) => `${assetsDir}/vocs-corpus-${hash}.json`

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

  function snapshot() {
    types ??= load().then((config) =>
      Types.snapshot({ packages: config.twoslash?.packages ?? [], root }),
    )
    return types
  }

  return {
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
    async generateBundle() {
      if (this.environment.config.consumer !== 'client') return
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
      for (const virtual of [id, typesId]) {
        const module = this.environment.moduleGraph.getModuleById(`\0${virtual}`)
        if (module) this.environment.moduleGraph.invalidateModule(module)
      }
    },
    async load(resolved) {
      // The snapshot is one large string, which the handler parses on its first Twoslash block.
      if (resolved === `\0${typesId}`)
        return `export default JSON.parse(${JSON.stringify(JSON.stringify(await snapshot()))})`
      if (resolved !== `\0${id}`) return undefined
      const [built, config] = await Promise.all([build(), load()])
      const asset = {
        hash: built.hash,
        url: `${base}${fileName(built.hash)}`,
      } satisfies Corpus.Asset
      // The type snapshot is a separate module, imported on the first Twoslash block.
      const types = config.twoslash
        ? `, [Symbol.for(${JSON.stringify(Highlight.typesKey.description)})]: () => import(${JSON.stringify(typesId)}).then((module) => module.default)`
        : ''
      return [
        `import config from ${JSON.stringify(configPath())}`,
        `export default { ...config, [Symbol.for(${JSON.stringify(Corpus.key.description)})]: ${JSON.stringify(asset)}${types} }`,
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
      if (source === id || source === typesId) return `\0${source}`
      return undefined
    },
  }
}

export declare namespace vocs {
  type Options = {
    /** Config file path, relative to the Vite root. Defaults to `vocs.config.ts`. */
    config?: string | undefined
  }
}
