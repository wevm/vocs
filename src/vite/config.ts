import type { PluginOption } from 'vite'
import * as Config from '../config.js'

const virtualModuleId = 'virtual:vocs/config'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

export function config(config: Config.Config): PluginOption {
  return {
    name: 'vocs:config',
    enforce: 'pre',
    config() {
      Config.setGlobal(config)
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        let content = ''

        content += `export const config = ${Config.serialize(config)}`

        return content
      }
      return
    },
  }
}
