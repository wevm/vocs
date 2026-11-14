/**
 * The `vocs()` Vite plugin. It serves `virtual:vocs/config`, the site config with its sources
 * built. The build reads every snapshot source once and writes the files as one
 * content-addressed static asset that the page loads on the first question, so the server
 * bundle carries only its URL. In dev, the dev server serves that asset, and a change to the
 * config or a Markdown file rebuilds it and reloads the config.
 * @module
 */
import * as Path from 'node:path'
import { type Plugin, runnerImport } from 'vite'
import type * as Config from '../Config.js'
import * as Corpus from '../internal/Corpus.js'
import * as NodeFiles from '../internal/NodeFiles.js'

const id = 'virtual:vocs/config'

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
  let corpus: Promise<Corpus.Corpus> | undefined

  const configPath = () => Path.resolve(root, options.config ?? 'vocs.config.ts')
  const fileName = (hash: string) => `${assetsDir}/vocs-corpus-${hash}.json`

  function build() {
    corpus ??= runnerImport<{ default: Config.Config }>(configPath()).then((imported) =>
      Corpus.build({
        config: imported.module.default,
        context: { env: process.env, files: NodeFiles.create(root) },
      }),
    )
    return corpus
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
      const module = this.environment.moduleGraph.getModuleById(`\0${id}`)
      if (module) this.environment.moduleGraph.invalidateModule(module)
    },
    async load(resolved) {
      if (resolved !== `\0${id}`) return undefined
      const built = await build()
      const asset = {
        hash: built.hash,
        url: `${base}${fileName(built.hash)}`,
      } satisfies Corpus.Asset
      return [
        `import config from ${JSON.stringify(configPath())}`,
        `export default { ...config, [Symbol.for(${JSON.stringify(Corpus.key.description)})]: ${JSON.stringify(asset)} }`,
      ].join('\n')
    },
    name: 'vocs',
    resolveId(source) {
      if (source === id) return `\0${id}`
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
