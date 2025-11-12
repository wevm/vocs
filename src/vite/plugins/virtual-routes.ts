import { existsSync, readFileSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import type { PluginOption } from 'vite'

import { getGitTimestamp } from '../utils/getGitTimestamp.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

export function virtualRoutes(): PluginOption {
  const virtualModuleId = 'virtual:routes'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  let globPattern: string
  let paths: string[] = []
  let cleanupHandlers: Array<() => void> = []
  let restartDebounceTimer: NodeJS.Timeout | undefined

  return {
    name: 'routes',
    async configureServer(server) {
      const { config } = await resolveVocsConfig()
      const { rootDir } = config
      const pagesPath = resolve(rootDir, 'pages')

      if (pagesPath) {
        server.watcher.add(pagesPath)

        const invalidateModule = () => {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            server.ws.send({
              type: 'full-reload',
              path: '*',
            })
          }
        }

        const addHandler = async (_path: string) => {
          // debounce to handle multiple rapid file additions
          if (restartDebounceTimer) clearTimeout(restartDebounceTimer)

          restartDebounceTimer = setTimeout(async () => {
            try {
              await refreshPaths()
              invalidateModule()
            } catch (_error) {
              // (error already logged in refreshPaths)
            }
          }, 100)
        }

        const unlinkHandler = async (_path: string) => {
          // debounce to handle multiple rapid file deletions
          if (restartDebounceTimer) clearTimeout(restartDebounceTimer)

          restartDebounceTimer = setTimeout(async () => {
            try {
              await refreshPaths()
              invalidateModule()
            } catch (_error) {
              // (error already logged in refreshPaths)
            }
          }, 100)
        }

        server.watcher.on('add', addHandler)
        server.watcher.on('unlink', unlinkHandler)

        cleanupHandlers.push(() => {
          server.watcher.off('add', addHandler)
          server.watcher.off('unlink', unlinkHandler)
          if (restartDebounceTimer) clearTimeout(restartDebounceTimer)
        })

        server.httpServer?.on('close', () => {
          cleanupHandlers.forEach((cleanup) => {
            cleanup()
          })
          cleanupHandlers = []
        })
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
          const replacer = globPattern.split('*')[0]

          const content = readFileSync(path, 'utf-8')
          const filePath = path.replace(`${pagesPath}/`, '')
          const fileGitTimestamp = await getGitTimestamp(path)

          // fileGitTimestamp can be `NaN` when not in git repo
          let lastUpdatedAt: number | undefined
          if (fileGitTimestamp) lastUpdatedAt = fileGitTimestamp

          let pagePath = path.replace(replacer, '').replace(/\.[^.]*$/, '')
          if (pagePath.endsWith('index'))
            pagePath = pagePath.replace(/index$/, '').replace(/\/$/, '')
          code += `  { lazy: () => import("${path}"), path: "/${pagePath}", type: "${type}", filePath: "${filePath}", content: "${encodeURIComponent(content)}", lastUpdatedAt: ${lastUpdatedAt} },`
          if (pagePath)
            code += `  { lazy: () => import("${path}"), path: "/${pagePath}.html", type: "${type}", filePath: "${filePath}", content: "${encodeURIComponent(content)}", lastUpdatedAt: ${lastUpdatedAt} },`
        }
        code += ']'
        return code
      }
      return
    },
    async buildStart() {
      await refreshPaths()
    },
    async handleHotUpdate({ file, server }) {
      // handle mdx/md/tsx/jsx hmr in pages dir
      if (!file.match(/\.(md|mdx|ts|tsx|js|jsx)$/)) return

      try {
        const { config } = await resolveVocsConfig()
        const { rootDir } = config
        const pagesPath = resolve(rootDir, 'pages')

        if (!file.startsWith(pagesPath)) return

        if (!existsSync(file)) {
          // file was deleted -> update paths
          paths = paths.filter((p) => p !== file)
        } else if (!paths.includes(file)) paths.push(file)

        const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          return [mod]
        }
      } catch (_error) {
        // (errors already handled by resolveVocsConfig)
      }

      return
    },
    buildEnd() {
      cleanupHandlers.forEach((cleanup) => {
        cleanup()
      })
      cleanupHandlers = []
      if (restartDebounceTimer) clearTimeout(restartDebounceTimer)
    },
  }

  async function refreshPaths() {
    try {
      const { config } = await resolveVocsConfig()
      const { rootDir } = config
      const pagesPath = resolve(rootDir, 'pages')
      globPattern = `${pagesPath}/**/*.{md,mdx,ts,tsx,js,jsx}`
      paths = await Array.fromAsync(glob(globPattern))
    } catch (_error) {
      // (error already logged by resolveVocsConfig)
    }
  }
}
