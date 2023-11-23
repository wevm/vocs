import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PluginOption } from 'vite'

type RoutesParameters = { root?: string }

export function virtualRoot({
  root = resolve(process.cwd(), './root.tsx'),
}: RoutesParameters = {}): PluginOption {
  const virtualModuleId = 'virtual:root'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'routes',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        if (!existsSync(root)) return 'export const Root = ({ children }) => children;'
        return `export { default as Root } from "${root}";`
      }
      return
    },
  }
}
