import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { type PluginOption } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

export function virtualStyles(): PluginOption {
  const virtualModuleId = 'virtual:styles'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'styles',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      const { config } = await resolveVocsConfig()
      const { rootDir } = config
      const rootStyles = resolve(rootDir, 'styles.css')
      if (id === resolvedVirtualModuleId) {
        if (!existsSync(rootStyles)) return ''
        return `import "${rootStyles}";`
      }
      return
    },
  }
}
