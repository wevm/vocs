import PluginReact from '@vitejs/plugin-react'
import PluginRsc from '@vitejs/plugin-rsc'
import type { Plugin, PluginOption, ResolvedConfig } from 'vite'
import type { Config as WakuConfig } from 'waku/config'
import * as Config from '../internal/config.js'
import { vocs as vocs_core } from '../vite.js'
import { getDefaultAdapter } from './internal/patches/utils/default-adapter.js'
import * as Plugins from './internal/vite-plugins.js'

/**
 * Creates a Vite plugin for Vocs, with given configuration.
 *
 * @param options - Configuration options.
 * @returns Plugin
 */
export async function vocs(options: vocs.Options = {}): Promise<PluginOption[]> {
  const {
    privateDir = 'private',
    rscBase = 'RSC',
    unstable_adapter = getDefaultAdapter(),
  } = options

  const config = await Config.resolve()
  const { basePath, srcDir, outDir } = config

  const wakuConfig = {
    basePath,
    srcDir,
    distDir: outDir,
    privateDir,
    rscBase,
    unstable_adapter,
    vite: {},
  }

  return [
    vocs_core(),
    react(),
    Plugins.allowServer(),
    PluginRsc({
      serverHandler: false,
      keepUseCientProxy: true,
      useBuildAppHook: true,
      clientChunks: (meta) => meta.serverChunk,
    }),
    Plugins.main(wakuConfig),
    Plugins.userEntries(wakuConfig),
    Plugins.virtualConfig(wakuConfig),
    Plugins.defaultAdapter(wakuConfig),
    Plugins.notFound(),
    Plugins.patchRsdw(),
    Plugins.buildMetadata(wakuConfig),
    Plugins.privateDir(wakuConfig),
    Plugins.fallbackHtml(),
    Plugins.fsRouterTypegen(wakuConfig),
    Plugins.preview(),
  ]
}

export declare namespace vocs {
  type Options = Omit<WakuConfig, 'basePath' | 'srcDir' | 'vite'>
}

/**
 * React plugin. Skips hooks if another React plugin is already present.
 */
function react(): Plugin[] {
  let skip = false
  const plugins = PluginReact()
  return plugins.map((plugin) => ({
    ...plugin,
    configResolved(config: ResolvedConfig) {
      const reactPlugins = config.plugins.filter((p) => p.name === 'vite:react-babel')
      skip = reactPlugins.length > 1
      if (!skip && typeof plugin.configResolved === 'function')
        plugin.configResolved.call(this, config)
    },
    transform(code, id, options) {
      if (skip || typeof plugin.transform !== 'function') return
      return plugin.transform.call(this, code, id, options)
    },
    buildStart(options) {
      if (skip || typeof plugin.buildStart !== 'function') return
      return plugin.buildStart.call(this, options)
    },
  }))
}
