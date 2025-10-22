import type { GetManualChunk, GetModuleInfo, ManualChunkMeta, OutputOptions } from 'rollup'
import type { PluginOption, UserConfig } from 'vite'

// copy from constants.ts
const CSS_LANGS_RE =
  // eslint-disable-next-line regexp/no-unused-capturing-group
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/
export const isCSSRequest = (request: string): boolean => CSS_LANGS_RE.test(request)

export class SplitVendorChunkCache {
  cache: Map<string, boolean>
  constructor() {
    this.cache = new Map<string, boolean>()
  }
  reset(): void {
    this.cache = new Map<string, boolean>()
  }
}

export function splitVendorChunk(options: { cache?: SplitVendorChunkCache } = {}): GetManualChunk {
  const cache = options.cache ?? new SplitVendorChunkCache()
  return (id, { getModuleInfo }) => {
    if (
      id.includes('node_modules') &&
      !isCSSRequest(id) &&
      staticImportedByEntry(id, getModuleInfo, cache.cache)
    )
      return 'vendor'
    return undefined
  }
}

function staticImportedByEntry(
  id: string,
  getModuleInfo: GetModuleInfo,
  cache: Map<string, boolean>,
  importStack: string[] = [],
): boolean {
  if (cache.has(id)) {
    return cache.get(id) as boolean
  }
  if (importStack.includes(id)) {
    // circular deps!
    cache.set(id, false)
    return false
  }
  const mod = getModuleInfo(id)
  if (!mod) {
    cache.set(id, false)
    return false
  }

  if (mod.isEntry) {
    cache.set(id, true)
    return true
  }
  const someImporterIs = mod.importers.some((importer) =>
    staticImportedByEntry(importer, getModuleInfo, cache, importStack.concat(id)),
  )
  cache.set(id, someImporterIs)
  return someImporterIs
}

export function splitVendorChunkPlugin(): PluginOption {
  const caches: SplitVendorChunkCache[] = []
  function createSplitVendorChunk(output: OutputOptions, config: UserConfig) {
    const cache = new SplitVendorChunkCache()
    caches.push(cache)
    const build = config.build ?? {}
    const format = output?.format
    if (!build.ssr && !build.lib && format !== 'umd' && format !== 'iife')
      return splitVendorChunk({ cache })
    return undefined
  }
  return {
    name: 'vite:split-vendor-chunk',
    config(config) {
      let outputs = config?.build?.rollupOptions?.output
      if (outputs) {
        outputs = Array.isArray(outputs) ? outputs : [outputs]
        for (const output of outputs) {
          const viteManualChunks = createSplitVendorChunk(output, config)
          if (viteManualChunks) {
            if (output.manualChunks) {
              if (typeof output.manualChunks === 'function') {
                const userManualChunks = output.manualChunks
                output.manualChunks = (id: string, api: ManualChunkMeta) => {
                  return userManualChunks(id, api) ?? viteManualChunks(id, api)
                }
              } else {
                // else, leave the object form of manualChunks untouched, as
                // we can't safely replicate rollup handling.
                // eslint-disable-next-line no-console
                console.warn(
                  "(!) the `splitVendorChunk` plugin doesn't have any effect when using the object form of `build.rollupOptions.output.manualChunks`. Consider using the function form instead.",
                )
              }
            } else {
              output.manualChunks = viteManualChunks
            }
          }
        }
      }
      return {
        build: {
          rollupOptions: {
            output: {
              manualChunks: createSplitVendorChunk({}, config),
            },
          },
        },
      }
    },
    buildStart() {
      // biome-ignore lint/suspicious/useIterableCallbackReturn: _
      caches.forEach((cache) => cache.reset())
    },
  }
}
