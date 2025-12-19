import type { Config } from '@react-router/dev/config'
import { reactRouter as reactRouterPlugin } from '@react-router/dev/vite'
import type { PluginOption } from 'vite'

import * as plugin from '../../vite/index.js'
import { reactRouterConfig } from './react-router-config.js'
import { recmaMdxMeta } from './recma/mdx-meta.js'

export function vocs(options: vocs.Options = {}): PluginOption {
  const { reactRouter = {} } = options

  return [
    plugin.vocs({
      mdx: {
        recmaPlugins: [recmaMdxMeta],
      },
    }),
    reactRouterConfig(reactRouter),
    reactRouterPlugin(),
  ]
}

export declare namespace vocs {
  type Options = {
    reactRouter?: Config | undefined
  }
}
