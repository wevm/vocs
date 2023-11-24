import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { type ConfigEnv, loadConfigFromFile } from 'vite'
import { type ParsedConfig, defaultConfig } from '../../config.js'

const extensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'mts']
const defaultConfigPaths = ['.vocs/config', 'vocs.config']

type ResolveVocsConfigParameters = {
  command?: ConfigEnv['command']
  configPath?: string
  mode?: ConfigEnv['mode']
}

export async function resolveVocsConfig(parameters: ResolveVocsConfigParameters = {}) {
  const { command = 'serve', mode = 'development' } = parameters

  const configPath = (() => {
    for (const ext of extensions) {
      if (parameters.configPath) return parameters.configPath
      for (const filePath of defaultConfigPaths)
        if (existsSync(resolve(process.cwd(), `${filePath}.${ext}`))) return `${filePath}.${ext}`
    }
    return
  })()

  const result = await loadConfigFromFile({ command, mode }, configPath)

  return {
    config: (result ? result.config : defaultConfig) as ParsedConfig,
    configPath,
  }
}
