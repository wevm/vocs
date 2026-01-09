import type { Plugin } from 'vite'

export function tailwindHmr(): Plugin {
  return {
    name: 'vocs-tailwind-hmr',
    configureServer(server) {
      server.watcher.on('change', async (file) => {
        if (!file.endsWith('.mdx')) return

        const keys = [...server.moduleGraph.idToModuleMap.keys()]
        const relationId = keys.find((id) => id.includes('styles.css'))

        if (relationId) {
          const relationModule = server.moduleGraph.getModuleById(relationId)
          if (relationModule) {
            server.moduleGraph.invalidateModule(relationModule)
            server.ws.send({
              type: 'update',
              updates: [
                {
                  type: 'js-update',
                  timestamp: Date.now(),
                  path: relationModule.url,
                  acceptedPath: relationModule.url,
                },
              ],
            })
          }
        }
      })
    },
  }
}
