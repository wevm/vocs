import { extname, resolve } from 'node:path'
import { globby } from 'globby'
import type { PluginOption } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { getGitTimestamp } from '../utils/getGitTimestamp.js'

export function virtualRoutes(): PluginOption {
  const virtualModuleId = 'virtual:routes'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  let glob: string
  let paths: string[] = []

  return {
    name: 'routes',
    async configureServer(server) {
      const { config } = await resolveVocsConfig()
      const { rootDir } = config
      const pagesPath = resolve(rootDir, 'pages')
      if (pagesPath) {
        server.watcher.add(pagesPath)
        server.watcher.on('add', () => server.restart())
        server.watcher.on('unlink', () => server.restart())
      }
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const { config } = await resolveVocsConfig()
        const { rootDir } = config
        const pagesPath = resolve(rootDir, 'pages')

        let code = 'export const routes = ['
        for (const path of paths) {
          const type = extname(path).match(/(mdx|md)/) ? 'mdx' : 'jsx'
          const replacer = glob.split('*')[0]

          const filePath = path.replace(`${pagesPath}/`, '')
          const fileGitTimestamp = await getGitTimestamp(path)

          // fileGitTimestamp can be `NaN` when not in git repo
          let lastUpdatedAt: number | undefined
          if (fileGitTimestamp) lastUpdatedAt = fileGitTimestamp

          let pagePath = path.replace(replacer, '').replace(/\.(.*)/, '')
          if (pagePath.endsWith('index'))
            pagePath = pagePath.replace('index', '').replace(/\/$/, '')
          code += `  { lazy: () => import("${path}"), path: "/${pagePath}", type: "${type}", filePath: "${filePath}", lastUpdatedAt: ${lastUpdatedAt} },`
          if (pagePath)
            code += `  { lazy: () => import("${path}"), path: "/${pagePath}.html", type: "${type}", filePath: "${filePath}", lastUpdatedAt: ${lastUpdatedAt} },`
        }
        code += ']'
        return code
      }
      return
    },
    async buildStart() {
      const { config } = await resolveVocsConfig()
      const { rootDir } = config
      const pagesPath = resolve(rootDir, 'pages')
      glob = `${pagesPath}/**/*.{md,mdx,ts,tsx,js,jsx}`
      paths = await globby(glob)
    },
    handleHotUpdate() {
      // TODO: handle changes
      return
    },
  }
}
