import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { type PluginOption, loadConfigFromFile } from 'vite'

type VocsConfigParameters = { configFile?: string }

export function vocsConfig({
  configFile = resolve(process.cwd(), './.vocs/config.ts'),
}: VocsConfigParameters = {}): PluginOption {
  const virtualModuleId = 'virtual:config'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'vocs-config',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        if (!existsSync(configFile)) return 'export const config = {}'

        const result = await loadConfigFromFile(
          // TODO: do these need to be modified? probably when we accept vite config.
          { command: 'serve', mode: 'development' },
          configFile,
        )
        if (!result) throw new Error('failed to load config.')
        // TODO: serialize fns
        return `export const config = ${JSON.stringify(result.config)}`
      }
      return
    },
    handleHotUpdate() {
      // TODO: handle changes
      return
    },
  }
}
