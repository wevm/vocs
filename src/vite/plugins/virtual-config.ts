import { createLogger, type PluginOption } from 'vite'

import { deserializeFunctionsStringified, serializeConfig } from '../../config.js'
import { clearConfigCache, resolveVocsConfig } from '../utils/resolveVocsConfig.js'

const logger = createLogger()

export function virtualConfig(): PluginOption {
  const virtualModuleId = 'virtual:config'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  let configPath: string | undefined
  let debounceTimer: NodeJS.Timeout | undefined
  let cleanupHandlers: Array<() => void> = []

  return {
    name: 'vocs-config',
    async configureServer(server) {
      const resolved = await resolveVocsConfig()
      configPath = resolved.configPath

      if (configPath) {
        server.watcher.add(configPath)

        const changeHandler = async (path: string) => {
          if (path !== configPath) return

          if (debounceTimer) clearTimeout(debounceTimer)

          // debounce config changes to handle rapid edits
          debounceTimer = setTimeout(async () => {
            try {
              clearConfigCache()

              const { config } = await resolveVocsConfig()
              const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
              if (mod) {
                server.moduleGraph.invalidateModule(mod)
              }

              server.ws.send('vocs:config', config)

              logger.info('Config updated successfully', { timestamp: true })
            } catch (error) {
              const err = error instanceof Error ? error : new Error(String(error))

              server.ws.send({
                type: 'error',
                err: {
                  message: `Vocs config error: ${err.message}`,
                  stack: err.stack || '',
                  plugin: 'vocs-config',
                },
              })
            }
          }, 100)
        }

        server.watcher.on('change', changeHandler)

        cleanupHandlers.push(() => {
          server.watcher.off('change', changeHandler)
          if (debounceTimer) clearTimeout(debounceTimer)
        })

        server.httpServer?.on('close', () => {
          cleanupHandlers.forEach((cleanup) => {
            cleanup()
          })
          cleanupHandlers = []
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
        return `
        ${deserializeFunctionsStringified}
        
        export const config = deserializeFunctions(${serializeConfig(config)})`
      }
      return
    },
    async handleHotUpdate({ server, file }) {
      if (file !== configPath) return

      clearConfigCache()

      // invalidate virtual mod
      const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
      if (mod) {
        server.moduleGraph.invalidateModule(mod)
        return [mod]
      }

      return
    },
    buildEnd() {
      cleanupHandlers.forEach((cleanup) => {
        cleanup()
      })
      cleanupHandlers = []
      if (debounceTimer) clearTimeout(debounceTimer)
    },
  }
}
