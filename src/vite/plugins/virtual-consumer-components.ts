import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PluginOption } from 'vite'

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
        ${exportComponent(resolve(rootDir, 'layout.tsx'), 'TopNavEnd', { named: true })}
      `
    },
  }
}

function exportComponent(path: string, name: string, { named = false }: { named?: boolean } = {}) {
  const exists =
    existsSync(path) && new RegExp(`export(.*)${name}`).test(readFileSync(path, 'utf-8'))
  if (exists) return `export { ${!named ? `default as ${name}` : name} } from "${path}";`
  return `export const ${name} = ({ children }) => children;`
}
