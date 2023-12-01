import { type PluginOption } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

export function virtualConfig(): PluginOption {
  const virtualModuleId = 'virtual:config'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'vocs-config',
    async configureServer(server) {
      const { configPath } = await resolveVocsConfig()
      if (configPath) {
        server.watcher.add(configPath)
        server.watcher.on('change', async (path) => {
          if (path !== configPath) return
          server.ws.send('vocs:config', (await resolveVocsConfig()).config)
        })
      }
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const { config } = await resolveVocsConfig()
        // TODO: serialize fns
        return `export const config = ${JSON.stringify(config)}`
      }
      return
    },
    handleHotUpdate() {
      // TODO: handle changes
      return
    },
  }
}
