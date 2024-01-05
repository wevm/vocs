import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { type PluginOption } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

export function virtualConsumerComponents(): PluginOption {
  const virtualModuleId = 'virtual:consumer-components'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'routes',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return

      const { config } = await resolveVocsConfig()
      const { rootDir } = config
      return `
        ${exportComponent(resolve(rootDir, 'layout.tsx'), 'Layout')}
        ${exportComponent(resolve(rootDir, 'footer.tsx'), 'Footer')}
      `
    },
  }
}

function exportComponent(path: string, name: string) {
  if (existsSync(path)) return `export { default as ${name} } from "${path}";`
  return `export const ${name} = ({ children }) => children;`
}
