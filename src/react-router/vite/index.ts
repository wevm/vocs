import { reactRouter as reactRouterPlugin } from '@react-router/dev/vite'
import type { PluginOption } from 'vite'
import * as plugin from '../../vite/index.js'
import { recmaMdxMeta } from './recma/mdx-meta.js'

export function vocs(): PluginOption {
  return [
    plugin.vocs({
      mdx: {
        recmaPlugins: [recmaMdxMeta],
      },
    }),
    reactRouterPlugin(),
  ]
}
