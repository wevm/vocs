import type { IconUrl, ParsedConfig } from '../../config.js'

const IS_PROD = process.env.NODE_ENV === 'production'

export function rewriteConfig(config: ParsedConfig) {
  const { baseUrl, vite, logoUrl, iconUrl } = config
  let basename = baseUrl || vite?.base
  if (!basename) {
    return
  }

  basename = basename?.replace(/\/*$/, '')
  basename = basename.replace(/^\/*/, '/')

  if (basename === '/') {
    return
  }

  if (!config.vite) {
    config.vite = {}
  }

  config.baseUrl = config.vite.base = basename

  if (IS_PROD) {
    if (iconUrl) {
      config.iconUrl = getImgUrlWithBase(iconUrl, basename)
    }

    if (logoUrl) {
      config.logoUrl = getImgUrlWithBase(logoUrl, basename)
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
