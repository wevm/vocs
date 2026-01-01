import PluginRsc from '@vitejs/plugin-rsc'
import type { PluginOption } from 'vite'
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
    Plugins.allowServer(),
    PluginRsc({
      serverHandler: false,
      keepUseCientProxy: true,
      useBuildAppHook: true,
      clientChunks: (meta) => meta.serverChunk,
    }),
    Plugins.main(wakuConfig),
    Plugins.userEntries(wakuConfig, config),
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
