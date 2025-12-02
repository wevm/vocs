import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { default as fs } from 'fs-extra'
import type { PluginOption } from 'vite'

import type { ParsedConfig, Theme } from '../../config.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

export function virtualStyles(): PluginOption {
  const virtualModuleId = 'virtual:styles'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  let configPath: string | undefined
  let cleanupHandlers: Array<() => void> = []
  let debounceTimer: NodeJS.Timeout | undefined

  return {
    name: 'styles',
    async buildStart() {
      try {
        const { config } = await resolveVocsConfig()
        const { theme } = config
        createThemeStyles({ theme })
      } catch (_error) {
        // (error already logged by resolveVocsConfig)
      }
    },
    async configureServer(server) {
      const resolved = await resolveVocsConfig()
      configPath = resolved.configPath

      if (configPath) {
        server.watcher.add(configPath)

        const changeHandler = async (path: string) => {
          if (path !== configPath) return

          if (debounceTimer) clearTimeout(debounceTimer)

          // debounce to handle rapid config edits
          debounceTimer = setTimeout(async () => {
            try {
              const { config } = await resolveVocsConfig()
              const { theme } = config
              createThemeStyles({ theme })

              const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
              if (mod) {
                server.moduleGraph.invalidateModule(mod)

                server.ws.send({
                  type: 'update',
                  updates: [
                    {
                      acceptedPath: mod.url,
                      path: mod.url,
                      timestamp: Date.now(),
                      type: 'js-update',
                    },
                  ],
                })
              }
            } catch (error) {
              const err = error instanceof Error ? error : new Error(String(error))

              server.ws.send({
                type: 'error',
                err: {
                  message: `Failed to update theme styles: ${err.message}`,
                  stack: err.stack || '',
                  plugin: 'vocs:styles',
                },
              })
            }
          }, 100)
        }

        server.watcher.on('change', changeHandler)

        cleanupHandlers.push(() => {
          server.watcher.off('change', changeHandler)
          if (debounceTimer) clearTimeout(debounceTimer)
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
      if (id !== resolvedVirtualModuleId) return

      const { config } = await resolveVocsConfig()
      const { rootDir } = config
      const themeStyles = resolve(import.meta.dirname, '../.vocs/theme.css')
      const rootStyles = resolve(rootDir, 'styles.css')
      let code = ''
      if (existsSync(themeStyles)) code += `import "${themeStyles}";`
      if (existsSync(rootStyles)) code += `import "${rootStyles}";`
      return code
    },
    buildEnd() {
      cleanupHandlers.forEach((cleanup) => {
        cleanup()
      })
      cleanupHandlers = []
      if (debounceTimer) clearTimeout(debounceTimer)
    },
  }
}

function createThemeStyles({ theme }: { theme: ParsedConfig['theme'] }) {
  const themeFile = resolve(import.meta.dirname, '../.vocs/theme.css')

  if (fs.existsSync(themeFile)) fs.rmSync(themeFile)
  if (!theme) return

  fs.createFileSync(themeFile)

  function createVars(variables: NonNullable<Theme['variables']>) {
    let code = ''
    for (const scope in variables) {
      for (const name in (variables as any)[scope]) {
        const value = (variables as any)[scope][name] as string | { light: string; dark: string }
        if (typeof value === 'string')
          code += `:root { --vocs-${scope}_${name}: ${value}; }\n:root.dark { --vocs-${scope}_${name}: ${value}; }\n`
        else {
          if (value?.light) code += `:root { --vocs-${scope}_${name}: ${value.light}; }\n`
          if (value?.dark) code += `:root.dark { --vocs-${scope}_${name}: ${value.dark}; }\n`
        }
      }
    }
    return code
  }

  const { accentColor, variables } = theme

  if (accentColor)
    fs.appendFileSync(
      themeFile,
      createVars({
        color: {
          backgroundAccent: accentColor.backgroundAccent,
          backgroundAccentHover: accentColor.backgroundAccentHover,
          backgroundAccentText: accentColor.backgroundAccentText,
          borderAccent: accentColor.borderAccent,
          textAccent: accentColor.textAccent,
          textAccentHover: accentColor.textAccentHover,
        },
      }),
    )
  if (variables) fs.appendFileSync(themeFile, createVars(variables))
}
