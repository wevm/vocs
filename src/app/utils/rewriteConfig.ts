import type { ParsedConfig } from '../../config.js'

export function rewriteConfig(config: ParsedConfig) {
  const { baseUrl, vite } = config
  if (baseUrl) {
    if (!config.vite) {
      config.vite = { base: baseUrl }
    } else {
      config.vite.base = baseUrl
    }
  } else if (vite?.base) {
    config.baseUrl = vite.base
  }
}
