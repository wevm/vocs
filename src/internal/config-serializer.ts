import type { Config } from './config.js'

export function forClient(config: Config): Partial<Config> {
  return {
    accentColor: config.accentColor,
    ai: config.ai,
    banner: config.banner,
    basePath: config.basePath,
    baseUrl: config.baseUrl,
    codeHighlight: {
      langAlias: config.codeHighlight.langAlias,
      langs: config.codeHighlight.langs,
      themes: config.codeHighlight.themes,
    },
    colorScheme: config.colorScheme,
    description: config.description,
    editLink: config.editLink,
    feedback: config.feedback,
    head: config.head,
    iconUrl: config.iconUrl,
    jsonLd: config.jsonLd,
    logoUrl: config.logoUrl,
    mcp: config.mcp ? { enabled: config.mcp.enabled } : undefined,
    ogImageUrl: config.ogImageUrl,
    renderStrategy: config.renderStrategy,
    search: config.search,
    sidebar: config.sidebar,
    socials: config.socials,
    title: config.title,
    titleTemplate: config.titleTemplate,
    topNav: config.topNav,
  }
}

export function serialize(config: Partial<Config>): string {
  return JSON.stringify(serializeFunctions(config))
}

// biome-ignore lint/suspicious/noExplicitAny: _
export function serializeFunctions(value: any, key?: string): any {
  if (Array.isArray(value)) {
    return value.map((v) => serializeFunctions(v))
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).reduce((acc, key) => {
      if (key[0] === '_') return acc
      acc[key] = serializeFunctions(value[key], key)
      return acc
      // biome-ignore lint/suspicious/noExplicitAny: _
    }, {} as any)
  }
  if (typeof value === 'function') {
    let serialized = value.toString()
    if (key && (serialized.startsWith(key) || serialized.startsWith(`async ${key}`))) {
      serialized = serialized.replace(key, 'function')
    }
    return `_vocs-fn_${serialized}`
  }
  return value
}

export function deserialize(config: string): Config {
  return deserializeFunctions(JSON.parse(config))
}

// biome-ignore lint/suspicious/noExplicitAny: _
export function deserializeFunctions(value: any): any {
  if (Array.isArray(value)) {
    return value.map(deserializeFunctions)
  }
  if (typeof value === 'object' && value !== null) {
    // biome-ignore lint/suspicious/noExplicitAny: _
    return Object.keys(value).reduce((acc: any, key) => {
      acc[key] = deserializeFunctions(value[key])
      return acc
    }, {})
  }
  if (typeof value === 'string' && value.includes('_vocs-fn_')) {
    return new Function(`return ${value.slice(9)}`)()
  }
  return value
}

export const deserializeFunctionsStringified = `
  function deserializeFunctions(value) {
    if (Array.isArray(value)) {
      return value.map(deserializeFunctions)
    } else if (typeof value === 'object' && value !== null) {
      return Object.keys(value).reduce((acc, key) => {
        acc[key] = deserializeFunctions(value[key])
        return acc
      }, {})
    } else if (typeof value === 'string' && value.includes('_vocs-fn_')) {
      return new Function(\`return \${value.slice(9)}\`)()
    } else {
      return value
    }
  }
`
