import type {
  Options as MiniSearchOptions,
  SearchOptions as MiniSearchSearchOptions,
} from 'minisearch'
import type * as Config from './config.js'

export const searchFields = ['category', 'subtitle', 'text', 'title', 'titles'] as const
export const storeFields = [
  'category',
  'href',
  'searchPriority',
  'subtitle',
  'text',
  'title',
  'titles',
  'type',
] as const

/**
 * Custom tokenizer that splits on whitespace, punctuation, and camelCase/PascalCase.
 * Keeps both original and split tokens so "TypeScript" matches both "typescript" and "type".
 *
 * "createUser" → ["createuser", "create", "user"]
 * "getHTTPResponse" → ["gethttpresponse", "get", "http", "response"]
 * "TypeScript" → ["typescript", "type", "script"]
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = []

  for (const word of text.split(/[\s\-._/:@]+/)) {
    if (!word) continue

    const lower = word.toLowerCase()
    tokens.push(lower)

    // Split camelCase/PascalCase and add sub-tokens if different from original
    const split = word
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → camel Case
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // HTTPResponse → HTTP Response
      .split(/\s+/)
      .map((w) => w.toLowerCase())
      .filter((w) => w.length > 0)

    if (split.length > 1) tokens.push(...split)
  }

  return tokens.filter((w) => w.length > 0)
}

export namespace SearchConfig {
  export function getIndexOptions(config?: Config.Config): MiniSearchOptions {
    const index = config?.search.index ?? {}
    return {
      ...index,
      fields: index.fields ? [...index.fields] : [...searchFields],
      storeFields: mergeStoreFields(index.storeFields),
      tokenize: index.tokenize ?? tokenize,
    }
  }

  export function getQueryOptions(config: Config.Config): MiniSearchSearchOptions {
    return {
      ...config.search.query,
      tokenize: config.search.query?.tokenize ?? config.search.index?.tokenize ?? tokenize,
    }
  }

  function mergeStoreFields(fields: readonly string[] | undefined): string[] {
    return [...new Set([...storeFields, ...(fields ?? [])])]
  }
}
