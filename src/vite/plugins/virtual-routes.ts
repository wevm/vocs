import { resolve } from 'node:path'
import { globby } from 'globby'
import type { PluginOption } from 'vite'
import { resolveVocsConfig } from '../utils.js'

export function virtualRoutes(): PluginOption {
  const virtualModuleId = 'virtual:routes'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  let glob: string
  let paths: string[] = []

  return {
    name: 'routes',
    async configureServer(server) {
      const { config } = await resolveVocsConfig()
      const { root } = config
      const pagesPath = resolve(root, 'pages')
      server.watcher.add(pagesPath)
      server.watcher.on('add', () => server.restart())
      server.watcher.on('unlink', () => server.restart())
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
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
      const { config } = await resolveVocsConfig()
      const { root } = config
      const pagesPath = resolve(root, 'pages')
      glob = `${pagesPath}/**/*.{md,mdx,ts,tsx,js,jsx}`
      paths = await globby(glob)
    },
    handleHotUpdate() {
      // TODO: handle changes
      return
    },
  }
}
