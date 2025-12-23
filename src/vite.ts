import type { PluginOption } from 'vite'
import * as Config from './internal/config.js'
import * as Plugins from './internal/vite-plugins.js'

/**
 * Vite plugin for Vocs.
 *
 * @param options - Configuration options.
 * @returns Plugin.
 */
export async function vocs(): Promise<PluginOption[]> {
  const config = await Config.resolve()

  return [
    Plugins.dedupe(),
    Plugins.llms(config),
    Plugins.mdx(config),
    Plugins.tailwind(),
    Plugins.virtualConfig(config),
  ]
}
