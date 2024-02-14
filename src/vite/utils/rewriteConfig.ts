import type { IconUrl, ParsedConfig } from '../../config.js'

const IS_PROD = process.env.NODE_ENV === 'production'

/**
 * The "baseUrl" refers to the public URL associated with the assets.
 * The "basename" is the prefix of the page routes.
 * If the vite.base starts with "http" or "https" and "baseUrl" is not provided. then it represents the baseUrl.
 * If it starts with "/" add "basename" is not provided. then it represents the basename.
 * The "baseUrl" takes precedence with higher priority, if vite.base starts with "http" or "https",
  The baseUrl will override vite.base.
*/

export function rewriteConfig(config: ParsedConfig) {
  const { baseUrl, vite, logoUrl, iconUrl } = config

  if (!config.vite) {
    config.vite = {}
  }

  if (baseUrl) {
    const viteBase = config.vite.base
    if (viteBase && !isHttpLink(viteBase)) {
      if (!config.basename) {
        config.basename = viteBase
      }
    }
    config.vite.base = baseUrl
  } else {
    if (isHttpLink(vite?.base)) {
      config.baseUrl = vite!.base
    } else if (vite?.base) {
      // relative path
      if (!config.basename) {
        config.basename = vite.base
      }
    }
  }

  if (config.baseUrl) {
    config.baseUrl = trimRight(config.baseUrl)
  }

  if (config.vite?.base) {
    config.vite.base = trimRight(config.vite?.base)
  }

  if (IS_PROD) {
    const assetsPrefix = getAssetsPrefix(config)
    if (!assetsPrefix) {
      return
    }
    if (iconUrl) {
      config.iconUrl = getImgUrlWithBase(iconUrl, assetsPrefix)
    }

    if (logoUrl) {
      config.logoUrl = getImgUrlWithBase(logoUrl, assetsPrefix)
    }
  }
}

export function getImgUrlWithBase(url: IconUrl | string, basename: string) {
  if (!url) {
    return url
  }

  if (typeof url === 'string') {
    return basename + url
  }
  let finalUrl: IconUrl
  const keys = Object.keys(url)
  for (let i = 0, len = keys.length; i < len; i++) {
    const k = keys[i]
    const urlWithBase = basename + url[k as keyof IconUrl]
    if (urlWithBase) {
      if (!finalUrl!) {
        finalUrl = {
          [k]: urlWithBase,
        } as IconUrl
      } else {
        ;(finalUrl[k as keyof IconUrl] as IconUrl) = urlWithBase
      }
    }
  }

  return finalUrl!
}

function isHttpLink(url?: string) {
  if (!url) {
    return false
  }
  return /^http(s?):\/\//.test(url)
}

export function getRouteBasename(config: ParsedConfig): string | undefined {
  const { basename } = config
  return basename || ''
}

export function getAssetsPrefix(config: ParsedConfig) {
  const { baseUrl } = config
  return baseUrl || ''
}

export function trimRight(str: string) {
  return str.replace(/\/*$/, '')
}
