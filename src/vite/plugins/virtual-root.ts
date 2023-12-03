import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { type PluginOption } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

export function virtualRoot(): PluginOption {
  const virtualModuleId = '@virtual/root'
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
      const rootComponent = resolve(rootDir, 'layout.tsx')
      if (!existsSync(rootComponent)) return 'export const Root = ({ children }) => children;'
      return `export { default as Root } from "${rootComponent}";`
    },
  }
}
