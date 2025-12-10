import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import toml from 'toml'
import { type ConfigEnv, createLogger, loadConfigFromFile } from 'vite'
import { defineConfig, getDefaultConfig, type ParsedConfig } from '../../config.js'

const moduleExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'mts']
const staticExtensions = ['toml', 'json']
const extensions = [...moduleExtensions, ...staticExtensions]
const defaultConfigPaths = ['.vocs/config', 'vocs.config', 'Vocs']

const logger = createLogger()

type ResolveVocsConfigParameters = {
  command?: ConfigEnv['command']
  configPath?: string
  mode?: ConfigEnv['mode']
}

let configCache: {
  config: ParsedConfig
  configPath: string | undefined
  timestamp: number
} | null = null

let errorCache: {
  message: string
  timestamp: number
} | null = null

export function clearConfigCache() {
  configCache = null
  errorCache = null
}

export async function resolveVocsConfig(parameters: ResolveVocsConfigParameters = {}) {
  const { command = 'serve', mode = 'development' } = parameters

  const [configPath, ext] = (() => {
    for (const ext of extensions) {
      if (parameters.configPath) return [parameters.configPath, ext]
      for (const filePath of defaultConfigPaths)
        if (existsSync(resolve(process.cwd(), `${filePath}.${ext}`)))
          return [`${filePath}.${ext}`, ext]
    }
    return [undefined, undefined]
  })()

  // if we recently failed to load this config, return cached result immediately
  // to avoid spamming the console with repeated errors from multiple plugins
  const now = Date.now()
  if (errorCache && errorCache.timestamp > now - 500) {
    if (configCache) {
      return {
        config: configCache.config,
        configPath: configCache.configPath,
      }
    }
    // return default config without logging again
    const config = await getDefaultConfig()
    return {
      config,
      configPath,
    }
  }

  try {
    const result = await (async () => {
      if (!ext) return

      if (moduleExtensions.includes(ext))
        return await loadConfigFromFile({ command, mode }, configPath)

      if (staticExtensions.includes(ext)) {
        if (!existsSync(configPath)) throw new Error(`Config file not found: ${configPath}`)

        const file = readFileSync(configPath, 'utf8')
        const rawConfig = (() => {
          if (ext === 'toml') return camelCaseKeys(toml.parse(file))
          if (ext === 'json') return JSON.parse(file)
          return
        })()

        const config = await defineConfig(rawConfig)
        return config ? { config } : undefined
      }

      return
    })()

    const config = (result ? result.config : await getDefaultConfig()) as ParsedConfig

    configCache = {
      config,
      configPath,
      timestamp: Date.now(),
    }

    return {
      config,
      configPath,
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    const now = Date.now()

    const shouldLog =
      !errorCache || errorCache.message !== err.message || errorCache.timestamp < now - 1_000

    if (shouldLog) {
      logger.error(`Failed to load Vocs config${configPath ? ` from ${configPath}` : ''}:`, {
        error: err,
        timestamp: true,
      })
      errorCache = {
        message: err.message,
        timestamp: now,
      }
    }

    // if we have a cached config, return it to keep the server running
    if (configCache) {
      return {
        config: configCache.config,
        configPath: configCache.configPath,
      }
    }

    // fall back to default config if no cache available
    const config = await getDefaultConfig()
    return {
      config,
      configPath,
    }
  }
}

function camelCaseKeys(obj: object): object {
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(camelCaseKeys)
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key.replace(/[-_](.)/g, (_, c) => c.toUpperCase()),
      camelCaseKeys(value),
    ]),
  )
}
