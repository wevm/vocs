import { getIconData, iconToHTML, iconToSVG } from '@iconify/utils'
import { type IconifyJSON, icons as lucide } from '@iconify-json/lucide'
import { icons as simple } from '@iconify-json/simple-icons'
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
    Plugins.arraybuffer(),
    Plugins.deps(),
    Plugins.groupIcons(config),
    Plugins.icons({
      compiler: 'jsx',
      customCollections: {
        lucide: getIcon(lucide),
        'simple-icons': getIcon(simple),
      },
      jsx: 'react',
    }),
    Plugins.langWatcher(config),
    Plugins.llms(config),
    Plugins.mdx(config),
    Plugins.routeWatcher(config),
    Plugins.search(config),
    Plugins.sitemap(config),
    Plugins.slots(config),
    Plugins.tailwind(),
    Plugins.userStyles(config),
    Plugins.virtualConfig(config),
    Plugins.virtualLangs(config),
  ]
}

/** @internal */
function getIcon(set: IconifyJSON) {
  return async (name: string) => {
    const data = getIconData(set, name)
    if (!data) return undefined
    const { attributes, body } = iconToSVG(data)
    return iconToHTML(body, attributes)
  }
}
