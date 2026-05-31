import * as crypto from 'node:crypto'
import type { TwoslashShikiReturn, TwoslashTypesCache } from '@shikijs/twoslash'
import LZString from 'lz-string'
import { FilePatcher } from './file-patcher.js'

/**
 * Inline twoslash cache.
 *
 * Persists the serialized twoslash result directly into the markdown source as a
 * `// @twoslash-cache: ...` comment inside the fenced code block. On the next
 * build the comment is read, validated against a hash of the source, and used
 * directly — skipping the TypeScript compiler entirely.
 *
 * Unlike the filesystem types cache (which lives in a separate, usually
 * gitignored directory), the inline cache travels with the source files, so it
 * stays warm across fresh clones and CI runs.
 *
 * Ported from `@shikijs/vitepress-twoslash`'s inline cache, adapted to vocs's
 * MDX/remark pipeline:
 * - source-map injection happens via a remark plugin (see `remarkInlineCache` in
 *   `mdx.ts`) instead of a Vite `load` hook + markdown-it.
 * - the queued patches are flushed by the `vocs:mdx` Vite plugin after each file
 *   is transformed.
 */

/** Source position of a fenced code block's body within its markdown file. */
export type SourceMap = {
  path: string
  from: number
  to: number
}

declare module '@shikijs/types' {
  interface ShikiTransformerContextMeta {
    sourceMap?: SourceMap | null
    __cache?: TwoslashShikiReturn
    __patch?: (newCache: string) => void
  }
}

/**
 * Tag used for the ephemeral source-map comment. This comment is injected into
 * the in-memory code value during compilation and stripped again before
 * twoslash/shiki run — it is never written to disk.
 */
const SOURCE_MAP_KEY = '@vocs-twoslash-source'
const SOURCE_MAP_REGEX = new RegExp(`// ${SOURCE_MAP_KEY}:(.*)(?:\n|$)`)

export function injectSourceMapComment(value: string, sourceMap: SourceMap): string {
  return `// ${SOURCE_MAP_KEY}:${JSON.stringify(sourceMap)}\n${value}`
}

export function extractSourceMapComment(code: string): {
  code: string
  sourceMap: SourceMap | null
} {
  let sourceMap: SourceMap | null = null
  try {
    code = code.replace(SOURCE_MAP_REGEX, (_, p1: string) => {
      sourceMap = JSON.parse(p1) as SourceMap
      return ''
    })
  } catch {
    // ignore malformed source map
  }
  return { code, sourceMap }
}

type CachePayload = {
  v: number
  hash: string
  data: string
}

/**
 * Cache payload format version. Kept at `1` even though the cache key changed
 * from `optionsHash:lang:code` to `lang:code` (see `cacheHash`): stale
 * payloads from the old key naturally fail the hash check on `preprocess` and
 * are transparently re-seeded on the next write, so a version bump (which
 * would force a one-shot invalidation of every committed cache comment) is
 * unnecessary.
 */
const CACHE_VERSION = 1

const CODE_INLINE_CACHE_KEY = '@twoslash-cache'
const CODE_INLINE_CACHE_REGEX = new RegExp(`// ${CODE_INLINE_CACHE_KEY}: (.*)(?:\n|$)`, 'g')
/** Matches a cache comment anchored to the start of a code block body. */
const CODE_INLINE_CACHE_LINE_REGEX = new RegExp(`^// ${CODE_INLINE_CACHE_KEY}: .*(?:\n|$)`)

/**
 * Remove all `// @twoslash-cache: ...` comments from a code string.
 *
 * Used when a virtual file's content is injected into another twoslash block
 * (via `[!include]` or `import` resolution). Without stripping, the included
 * file's own cache comment would be inlined ahead of the host block's code and
 * picked up as the host's cache, causing a permanent hash mismatch (and a
 * spurious cache comment to be re-appended on every build).
 */
export function stripInlineCacheComments(code: string): string {
  return code.replace(CODE_INLINE_CACHE_REGEX, '')
}

export function createInlineTypesCache(
  options: { remove?: boolean | undefined; ignoreCache?: boolean | undefined } = {},
): { typesCache: TwoslashTypesCache; patcher: FilePatcher } {
  const { remove, ignoreCache } = options
  const patcher = new FilePatcher()

  // Key the cache on the (already fully-composed) snippet code and language
  // only — deliberately NOT on the twoslash options. The whole point of the
  // inline cache is to travel with the repo across machines and CI, but
  // `twoslashOptions` frequently contain environment-specific or volatile
  // values (absolute paths, config that branches on whether built `.d.ts`
  // files exist, etc). Hashing them in makes the committed cache miss on any
  // machine other than the one that seeded it. This matches the filesystem
  // types cache, which also keys on code alone.
  function cacheHash(code: string, lang?: string): string {
    return crypto
      .createHash('sha256')
      .update(`${lang ?? ''}:${code}`)
      .digest('hex')
  }

  function stringifyCachePayload(data: TwoslashShikiReturn, code: string, lang?: string): string {
    const payload: CachePayload = {
      v: CACHE_VERSION,
      hash: cacheHash(code, lang),
      data: LZString.compressToBase64(JSON.stringify(data)),
    }
    return JSON.stringify(payload)
  }

  function resolveCachePayload(cache: string): {
    payload: CachePayload
    twoslash: () => TwoslashShikiReturn | null
  } | null {
    if (!cache) return null
    try {
      const payload = JSON.parse(cache) as CachePayload
      if (payload.v === CACHE_VERSION) {
        return {
          payload,
          twoslash: () => {
            try {
              return JSON.parse(LZString.decompressFromBase64(payload.data))
            } catch {
              return null
            }
          },
        }
      }
    } catch {
      // ignore malformed payload
    }
    return null
  }

  function resolveSourcePatcher(
    source: SourceMap,
    search?: string,
  ): ((newCache: string) => void) | undefined {
    const file = patcher.load(source.path)
    if (file === null) return undefined

    const range: { from: number; to?: number } = { from: source.from }
    let linebreak = true

    let located = false
    if (search) {
      const cachePos = file.content.indexOf(search, source.from)
      if (cachePos !== -1 && cachePos < source.to) {
        range.from = cachePos
        range.to = cachePos + search.length
        linebreak = search.endsWith('\n')
        located = true
      }
    }

    // Fallback: if the existing cache comment wasn't located via `search` (e.g.
    // a concurrent build environment already wrote one, or the in-memory code
    // was stale), detect a cache comment at the block body start and replace it
    // in place rather than appending a duplicate.
    if (!located) {
      const body = file.content.slice(source.from, source.to)
      const match = body.match(CODE_INLINE_CACHE_LINE_REGEX)
      if (match) {
        range.from = source.from
        range.to = source.from + match[0].length
        linebreak = match[0].endsWith('\n')
      }
    }

    const patchKey = FilePatcher.key(range.from, range.to)
    return (newCache: string) => {
      if (newCache === '') {
        // remove the existing cache comment if one was found
        if (range.to !== undefined) file.patches.set(patchKey, '')
        return
      }
      file.patches.set(patchKey, newCache + (linebreak ? '\n' : ''))
    }
  }

  const typesCache: TwoslashTypesCache = {
    preprocess(code, lang, _options, meta) {
      if (!meta) return

      let rawCache = ''
      let cacheString = ''

      code = code.replaceAll(CODE_INLINE_CACHE_REGEX, (full, p1: string) => {
        // keep only the first occurrence (duplicates may appear via @include)
        if (!rawCache.length) {
          cacheString = p1
          rawCache = full
        }
        return ''
      })

      const shouldLoadCache = !ignoreCache && !remove
      if (shouldLoadCache) {
        const cache = resolveCachePayload(cacheString)
        if (cache?.payload.hash === cacheHash(code, lang)) {
          const twoslash = cache.twoslash()
          if (twoslash) meta.__cache = twoslash
        }
      }

      if (meta.sourceMap) {
        const patch = resolveSourcePatcher(meta.sourceMap, rawCache)
        if (patch) meta.__patch = patch
      }

      return code
    },
    read(_code, _lang, _options, meta) {
      return meta?.__cache ?? null
    },
    write(code, data, lang, _options, meta) {
      if (remove) {
        meta?.__patch?.('')
        return
      }
      const twoslashShiki = simplifyTwoslashReturn(data)
      const cacheStr = `// ${CODE_INLINE_CACHE_KEY}: ${stringifyCachePayload(twoslashShiki, code, lang)}`
      meta?.__patch?.(cacheStr)
    },
  }

  return { typesCache, patcher }
}

/** Keep only the fields shiki needs when serializing a twoslash result. */
function simplifyTwoslashReturn(ret: TwoslashShikiReturn): TwoslashShikiReturn {
  return {
    nodes: ret.nodes,
    code: ret.code,
    ...(ret.meta?.extension !== undefined ? { meta: { extension: ret.meta.extension } } : {}),
  }
}

function isEnabledEnv(key: string): boolean | null {
  const val = process.env?.[key]?.toLowerCase()
  if (val)
    return (
      (
        {
          true: true,
          false: false,
          1: true,
          0: false,
          yes: true,
          no: false,
          y: true,
          n: false,
        } as Record<string, boolean>
      )[val] ?? null
    )
  return null
}

/**
 * Resolve whether the inline cache is enabled. The `TWOSLASH_INLINE_CACHE`
 * environment variable takes precedence over the config flag.
 */
export function enabled(configFlag?: boolean | undefined): boolean {
  const env = isEnabledEnv('TWOSLASH_INLINE_CACHE')
  if (env !== null) return env
  return Boolean(configFlag)
}

function envOptions(): { remove: boolean; ignoreCache: boolean } {
  return {
    remove: isEnabledEnv('TWOSLASH_INLINE_CACHE_REMOVE') === true,
    ignoreCache: isEnabledEnv('TWOSLASH_INLINE_CACHE_IGNORE') === true,
  }
}

let current: { typesCache: TwoslashTypesCache; patcher: FilePatcher } | undefined

/** Get (or lazily create) the process-wide inline cache instance. */
export function getOrCreate(): { typesCache: TwoslashTypesCache; patcher: FilePatcher } {
  if (!current) current = createInlineTypesCache(envOptions())
  return current
}

/** Flush any queued write-backs for `path` to disk. No-op if not initialized. */
export function flush(path: string): void {
  current?.patcher.patch(path)
}

/** Reset the singleton (primarily for tests). */
export function reset(): void {
  current = undefined
}
