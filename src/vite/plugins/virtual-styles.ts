import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { default as fs } from 'fs-extra'
import { type PluginOption } from 'vite'

import type { ParsedConfig, Theme } from '../../config.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function virtualStyles(): PluginOption {
  const virtualModuleId = 'virtual:styles'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'styles',
    async buildStart() {
      const { config } = await resolveVocsConfig()
      const { theme } = config
      createThemeStyles({ theme })
    },
    async configureServer(server) {
      const { configPath } = await resolveVocsConfig()
      if (configPath) {
        server.watcher.add(configPath)
        server.watcher.on('change', async (path) => {
          if (path !== configPath) return
          const { config } = await resolveVocsConfig()
          const { theme } = config
          createThemeStyles({ theme })
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
      const themeStyles = resolve(__dirname, '../.vocs/theme.css')
      const rootStyles = resolve(rootDir, 'styles.css')
      let code = ''
      if (existsSync(themeStyles)) code += `import "${themeStyles}";`
      if (existsSync(rootStyles)) code += `import "${rootStyles}";`
      return code
    },
  }
}

function createThemeStyles({ theme }: { theme: ParsedConfig['theme'] }) {
  const themeFile = resolve(__dirname, '../.vocs/theme.css')

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
