import { platform } from 'node:os'
import { extname, resolve } from 'node:path'
import { globby } from 'globby'
import type { PluginOption } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { getGitTimestamp } from '../utils/getGitTimestamp.js'
import { padStartSlash } from '../utils/slash.js'

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
        for (const _path of paths) {
          // _path is just a relative path starting with `pages`
          const path = resolve(rootDir, _path)

          // On Windows, unable to use full path to file for dynamic import
          // will always prompt that the file cannot be found
          const componentPath = platform() === 'win32' ? `./${rootDir}/${_path}` : path

          const type = extname(path).match(/(mdx|md)/) ? 'mdx' : 'jsx'
          const filePath = path.replace(`${pagesPath}/`, '')
          const fileGitTimestamp = await getGitTimestamp(path)

          // fileGitTimestamp can be `NaN` when not in git repo
          let lastUpdatedAt: number | undefined
          if (fileGitTimestamp) lastUpdatedAt = fileGitTimestamp

          let pagePath = path.replace(pagesPath, '').replace(/\.(.*)/, '')

          if (pagePath.endsWith('index'))
            pagePath = pagePath.replace('index', '').replace(/\/$/, '')
          code += `  { lazy: () => import("${componentPath}"), path: "${padStartSlash(
            pagePath,
          )}", type: "${type}", filePath: "${filePath}", lastUpdatedAt: ${lastUpdatedAt} },`

          if (pagePath && !['/', '\\'].includes(pagePath))
            code += `  { lazy: () => import("${componentPath}"), path: "${padStartSlash(
              pagePath,
            )}.html", type: "${type}", filePath: "${filePath}", lastUpdatedAt: ${lastUpdatedAt} },`
        }
        code += ']'
        return code
      }
      return
    },
    async buildStart() {
      const { config } = await resolveVocsConfig()
      const { rootDir } = config

      // Scan the routing files in the `pages` directory from rootDir,
      // to obtain the scanning results of relative paths.
      glob = 'pages/**/*.{md,mdx,ts,tsx,js,jsx}'
      paths = await globby(glob, {
        cwd: resolve(rootDir),
        ignore: ['**/node_modules/**', '**/dist/**'],
      })
    },
    handleHotUpdate() {
      // TODO: handle changes
      return
    },
  }
}
