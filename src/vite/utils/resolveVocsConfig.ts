import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import toml from 'toml'
import { type ConfigEnv, loadConfigFromFile } from 'vite'
import { type ParsedConfig, defineConfig, getDefaultConfig, type IconUrl } from '../../config.js'
import { getImgUrlWithBase, linkItemsWithBase, sidebarItemsWithBase, topNavItemsWithBase } from '../../app/utils/getImgUrlWithBase.js'

const moduleExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'mts']
const staticExtensions = ['toml', 'json']
const extensions = [...moduleExtensions, ...staticExtensions]
const defaultConfigPaths = ['.vocs/config', 'vocs.config', 'Vocs']

type ResolveVocsConfigParameters = {
  command?: ConfigEnv['command']
  configPath?: string
  mode?: ConfigEnv['mode']
}

export async function resolveVocsConfig(parameters: ResolveVocsConfigParameters = {}) {
  const { command = 'serve', mode = 'development' } = parameters

  const [configPath, ext] = (() => {
    for (const ext of extensions) {
      if (parameters.configPath) return parameters.configPath
      for (const filePath of defaultConfigPaths)
        if (existsSync(resolve(process.cwd(), `${filePath}.${ext}`)))
          return [`${filePath}.${ext}`, ext]
    }
    return [undefined, undefined]
  })()

  const result = await (async () => {
    if (!ext) return

    if (moduleExtensions.includes(ext))
      return await loadConfigFromFile({ command, mode }, configPath)

    if (staticExtensions.includes(ext)) {
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

  let config = (result ? result.config : await getDefaultConfig()) as ParsedConfig

  config = rewriteVocsBaseUrl(config);

  return {
    config,
    configPath,
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


export function rewriteVocsBaseUrl(configParams: ParsedConfig){
  const config = { ...configParams }
  if(config.baseUrl) {
    config.vite = {
      ...config.vite,
      base: config.baseUrl
    }
  } else if(config.vite?.base) {
    config.baseUrl = config.vite?.base
  }

  let baseUrl = config.baseUrl
  if(baseUrl) {
    baseUrl = baseUrl?.replace(/\/*$/, '')
    baseUrl = baseUrl.replace(/^\/*/, '/')
    config.baseUrl = baseUrl
  }

  if(!config.baseUrl) {
    return config;
  }

  if(config.topNav) {
    config.topNav = topNavItemsWithBase(config.topNav, baseUrl);
  }

  if(config.sidebar) {
    config.sidebar = sidebarItemsWithBase(config.sidebar, baseUrl);
  }

  ['iconUrl', 'logoUrl'].forEach((key) => {
    if(config[key as 'iconUrl' | 'logoUrl']) {
      config[key as 'iconUrl' | 'logoUrl'] = getImgUrlWithBase(config[key as 'iconUrl' | 'logoUrl'] as IconUrl, config.baseUrl)
    }
  });

  return config;
}