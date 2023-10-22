import { globby } from 'globby'
import type { PluginOption } from 'vite'

type RoutesParameters = { paths: string }

export function routes({ paths: glob }: RoutesParameters): PluginOption {
  const virtualModuleId = 'virtual:routes'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  let paths: string[] = []

  return {
    name: 'routes',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        let code = 'export const routes = ['
        for (const path of paths) {
          const type = path
            .split('.')
            .pop()
            ?.match(/(mdx|md)/)
            ? 'mdx'
            : 'jsx'
          const replacer = glob.split('*')[0]
          let pagePath = path.replace(replacer, '').replace(/\.(.*)/, '')
          if (pagePath.endsWith('index'))
            pagePath = pagePath.replace('index', '').replace(/\/$/, '')
          code += `  { lazy: () => import("${path}"), path: "/${pagePath}", type: "${type}" },`
          if (pagePath)
            code += `  { lazy: () => import("${path}"), path: "/${pagePath}.html", type: "${type}" },`
        }
        code += ']'
        return code
      }
      return
    },
    async buildStart() {
      paths = await globby(glob)
    },
    handleHotUpdate() {
      // TODO: handle changes
      return
    },
  }
}
