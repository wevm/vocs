/**
 * Retriever abstraction for Vocs semantic search.
 *
 * A retriever turns a query into a ranked list of results. Retrievers delegate
 * retrieval to a managed backend (e.g. Cloudflare AI Search), so Vocs does not
 * build or host a local vector index. Adapters hold secrets (API tokens) and
 * therefore must only ever live in the private `_retriever` config — never in
 * serializable config sent to the browser.
 *
 * Heavy/Node-only modules are avoided so this stays light in the static graph of
 * `config.ts` (which edge `vocs/server` consumers pull in).
 */

import type * as Config from './config.js'

/** A single semantic search result returned by a retriever. */
export type Result = {
  /** Top-level category the result belongs to. */
  category: string
  /** URL of the source page/section (may be external). */
  href: string
  /** Unique result id. */
  id: string
  /** Relevance score in `[0, 1]` (higher is more relevant). */
  score: number
  /** Short preview text shown in results. */
  snippet: string
  /** Title of the source page/section. */
  title: string
  /** Ancestor section titles (breadcrumb trail). */
  titles: string[]
  /** Kind of source document. */
  type: 'page' | 'section' | 'nav'
}

/** Context passed to {@link Adapter.retrieve}. */
export type RetrieveContext = {
  /** Maximum number of results to return. */
  limit: number
  /** Optional abort signal to cancel the request. */
  signal?: AbortSignal | undefined
}

/**
 * A retrieval adapter. Follows the same shape as {@link Embedding.Adapter} and
 * {@link Feedback.Adapter}: a plain object with a `type` discriminator and an
 * async `retrieve` method. Built-ins use `fetch` (no vendor SDK) so they run in
 * any modern runtime.
 */
export type Adapter = {
  /** Retrieve ranked results for a query. */
  retrieve: (query: string, context: RetrieveContext) => Promise<readonly Result[]>
  /** Adapter type identifier (e.g. `'cloudflare'`). */
  type: string
}

/**
 * Creates a retriever adapter from a custom definition.
 *
 * @example
 * ```ts
 * import { Retriever } from 'vocs/config'
 *
 * const retriever = Retriever.from({
 *   type: 'custom',
 *   async retrieve(query, { limit }) { ... },
 * })
 * ```
 */
export function from(adapter: Adapter): Adapter {
  return adapter
}

/** A single chunk in a Cloudflare AI Search `search` response. */
export type CloudflareChunk = {
  /** Chunk id. */
  id?: string | undefined
  /** Source item (object key + custom metadata). */
  item?:
    | {
        /** Object key (e.g. R2 path) the chunk was indexed from. */
        key?: string | undefined
        /** Custom metadata attached at ingest time. */
        metadata?: Record<string, unknown> | undefined
        /** Unix timestamp of the item. */
        timestamp?: number | undefined
      }
    | undefined
  /** Relevance score. */
  score?: number | undefined
  /** Chunk text content. */
  text?: string | undefined
  /** Chunk type. */
  type?: string | undefined
}

type CloudflareSearchResponse = {
  result?: { chunks?: CloudflareChunk[] | undefined } | undefined
  success?: boolean | undefined
}

/**
 * Cloudflare AI Search retriever (formerly AutoRAG). Calls the managed
 * `instances/{id}/search` REST endpoint, which owns ingestion, chunking,
 * embedding, and vector search — an open-ended alternative to hosting your own
 * vector DB.
 *
 * The API token needs `AI Search:Run` (and `AI Search:Edit`) permissions.
 * Results are mapped from chunk metadata; attach `href`/`title`/`category`/
 * `type` as custom metadata at ingest, or pass `mapResult` to customize.
 *
 * @example
 * ```ts
 * import { defineConfig, Retriever } from 'vocs/config'
 *
 * export default defineConfig({
 *   search: { retriever: Retriever.cloudflare({ instance: 'my-docs' }) },
 * })
 * ```
 */
export function cloudflare(options: cloudflare.Options): Adapter {
  const {
    accountId = process.env['CLOUDFLARE_ACCOUNT_ID'],
    apiToken = process.env['CLOUDFLARE_API_TOKEN'],
    baseUrl = 'https://api.cloudflare.com/client/v4',
    filters,
    headers,
    instance,
    mapResult,
    namespace,
    reranking,
    retrievalType,
    rewriteQuery = false,
    scoreThreshold,
  } = options
  return {
    type: 'cloudflare',
    async retrieve(query, context) {
      if (!accountId)
        throw new Error(
          '[vocs] Retriever.cloudflare: missing `accountId` (or CLOUDFLARE_ACCOUNT_ID).',
        )
      if (!apiToken)
        throw new Error(
          '[vocs] Retriever.cloudflare: missing `apiToken` (or CLOUDFLARE_API_TOKEN).',
        )
      if (!instance) throw new Error('[vocs] Retriever.cloudflare: missing `instance`.')

      // Instances created inside a namespace use the namespace-scoped path.
      const scope = namespace
        ? `ai-search/namespaces/${namespace}/instances/${instance}`
        : `ai-search/instances/${instance}`
      const url = `${baseUrl.replace(/\/$/, '')}/accounts/${accountId}/${scope}/search`
      const body = {
        ai_search_options: {
          query_rewrite: { enabled: rewriteQuery },
          ...(reranking != null ? { reranking: { enabled: reranking } } : {}),
          retrieval: {
            max_num_results: context.limit,
            ...(scoreThreshold != null ? { match_threshold: scoreThreshold } : {}),
            ...(retrievalType ? { retrieval_type: retrievalType } : {}),
            ...(filters ? { filters } : {}),
          },
        },
        query,
      }
      const response = await fetch(url, {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          ...headers,
        },
        method: 'POST',
        signal: context.signal ?? null,
      })
      if (!response.ok)
        throw new Error(
          `[vocs] Cloudflare AI Search failed (${response.status}): ${await safeText(response)}`,
        )

      const json = (await response.json()) as CloudflareSearchResponse
      const chunks = json.result?.chunks ?? []
      const results: Result[] = []
      for (const chunk of chunks) {
        const meta = chunk.item?.metadata ?? {}
        const href = str(meta['href']) ?? str(meta['url']) ?? deriveHref(chunk.item?.key)
        if (!href) continue
        // AI Search instances often store only a URL (no title/category). Derive
        // a clean title + breadcrumb from the canonical URL path — never from the
        // object key, which mashes the whole path into one underscored segment.
        const segments = pathSegments(str(meta['url']) ?? deriveHref(chunk.item?.key) ?? href)
        const last = segments.at(-1)
        const first = segments[0]
        const result: Result = {
          category: str(meta['category']) ?? (segments.length > 1 && first ? humanize(first) : ''),
          href,
          id: chunk.id || href,
          score: clamp01(chunk.score ?? 0),
          snippet: (chunk.text ?? '').slice(0, 240),
          title: str(meta['title']) ?? (last ? humanize(last) : (hostname(href) ?? href)),
          titles: Array.isArray(meta['titles'])
            ? meta['titles'].map(String)
            : segments.slice(1, -1).map(humanize),
          type: (str(meta['type']) as Result['type']) ?? 'page',
        }
        results.push(mapResult ? mapResult(chunk, result) : result)
      }
      return results
    },
  }
}

export declare namespace cloudflare {
  type Options = {
    /** Cloudflare account id. @default process.env.CLOUDFLARE_ACCOUNT_ID */
    accountId?: string | undefined
    /** API token with `AI Search:Run`. @default process.env.CLOUDFLARE_API_TOKEN */
    apiToken?: string | undefined
    /** API base URL. @default 'https://api.cloudflare.com/client/v4' */
    baseUrl?: string | undefined
    /** Metadata filters passed to `ai_search_options.retrieval.filters`. */
    filters?: Record<string, unknown> | undefined
    /** Extra request headers. */
    headers?: Record<string, string> | undefined
    /** AI Search instance id (required). */
    instance: string
    /** Map a raw chunk to a {@link Result}, overriding the default mapping. */
    mapResult?: ((chunk: CloudflareChunk, defaults: Result) => Result) | undefined
    /** Namespace the instance belongs to. Omit for non-namespaced instances. */
    namespace?: string | undefined
    /** Enable Cloudflare reranking. @default instance default */
    reranking?: boolean | undefined
    /** Retrieval strategy. @default instance default */
    retrievalType?: 'vector' | 'keyword' | 'hybrid' | undefined
    /** Rewrite the query with an LLM before retrieval (slower). @default false */
    rewriteQuery?: boolean | undefined
    /** Minimum match score (`retrieval.match_threshold`). */
    scoreThreshold?: number | undefined
  }
}

/** User-facing `search.retriever` input: an adapter, or an options object. */
export type Input =
  | Adapter
  | {
      /** Retrieval adapter (holds secrets; kept server-side only). */
      adapter: Adapter
      /** Explicitly enable/disable. Defaults to enabled when present. */
      enabled?: boolean | undefined
      /** Override the server endpoint path. @default `{basePath}/api/search/retrieve` */
      endpoint?: string | undefined
      /** Fuse semantic results with keyword (MiniSearch) results client-side. @default true */
      hybrid?: boolean | { keywordWeight?: number; semanticWeight?: number } | undefined
      /** Max results returned to the client. @default 8 */
      topK?: number | undefined
      /** Search dialog UI behavior. */
      ui?: { debounceMs?: number | undefined } | undefined
    }

/** Serializable retriever config — safe to send to the browser. */
export type PublicConfig = {
  /** Whether retriever search is enabled. */
  enabled: boolean
  /** Server endpoint path that runs retrieval. */
  endpoint: string
  /** Fuse keyword + semantic results into one ranking (done client-side). */
  hybrid: {
    /** Whether hybrid fusion is enabled. */
    enabled: boolean
    /** Weight applied to keyword (MiniSearch) results during fusion. */
    keywordWeight: number
    /** Weight applied to semantic (retriever) results during fusion. */
    semanticWeight: number
  }
  /** Client UI behavior for the search dialog. */
  ui: {
    /** Debounce before firing a semantic request (ms). */
    debounceMs: number
  }
}

/** Server-only retriever config — holds the adapter/secrets, never serialized. */
export type PrivateConfig = {
  /** Retrieval adapter used to fetch results. */
  adapter: Adapter
  /** Max results returned to the client. */
  topK: number
}

/**
 * Splits user `search.retriever` input into a public (serializable) config and a
 * private (server-only) config. Returns `undefined` when disabled.
 */
export function resolve(input: Input | undefined, ctx: resolve.Context): resolve.ReturnType {
  if (!input) return undefined
  const isAdapter = typeof (input as Adapter).retrieve === 'function'
  const options = isAdapter ? { adapter: input as Adapter } : (input as Exclude<Input, Adapter>)
  if (options.enabled === false) return undefined

  const adapter = options.adapter
  if (!adapter) {
    console.warn(
      '[vocs] search.retriever is enabled but no adapter was provided. Retriever search disabled.',
    )
    return undefined
  }

  const basePath = ctx.basePath.endsWith('/') ? ctx.basePath.slice(0, -1) : ctx.basePath
  const endpoint = options.endpoint ?? `${basePath}/api/search/retrieve`
  const hybrid = options.hybrid
  const hybridObj = typeof hybrid === 'object' && hybrid ? hybrid : {}

  const publicConfig: PublicConfig = {
    enabled: true,
    endpoint,
    hybrid: {
      enabled: hybrid !== false,
      keywordWeight: hybridObj.keywordWeight ?? 0.3,
      semanticWeight: hybridObj.semanticWeight ?? 0.7,
    },
    ui: { debounceMs: options.ui?.debounceMs ?? 250 },
  }
  const privateConfig: PrivateConfig = { adapter, topK: options.topK ?? 8 }

  return { private: privateConfig, public: publicConfig }
}

export declare namespace resolve {
  type Context = {
    /** Site base path, used to derive the default endpoint. */
    basePath: string
  }
  type ReturnType = { private: PrivateConfig; public: PublicConfig } | undefined
}

/** Reads the resolved public retriever config off a Config, or `undefined`. */
export function fromConfig(config: Config.Config): PublicConfig | undefined {
  const retriever = (config.search as { retriever?: unknown } | undefined)?.retriever
  if (
    retriever &&
    typeof retriever === 'object' &&
    'enabled' in retriever &&
    (retriever as PublicConfig).enabled
  )
    return retriever as PublicConfig
  return undefined
}

/** Runs the configured retriever, dedupes by href, and caps at `limit`. */
export async function retrieve(
  config: Config.Config,
  options: retrieve.Options,
): Promise<Result[]> {
  const priv = requirePrivate(config)
  const limit = options.limit ?? priv.topK
  const raw = await priv.adapter.retrieve(options.query, { limit, signal: options.signal })

  const seen = new Set<string>()
  const results: Result[] = []
  for (const result of raw) {
    if (!result.href || seen.has(result.href)) continue
    seen.add(result.href)
    results.push(result)
    if (results.length >= limit) break
  }
  return results
}

export declare namespace retrieve {
  type Options = {
    /** Max results to return. @default topK */
    limit?: number | undefined
    /** Search query. */
    query: string
    /** Optional abort signal. */
    signal?: AbortSignal | undefined
  }
}

type RequestBody = {
  limit?: unknown
  query?: unknown
}

/** Handles `POST /api/search/retrieve`. Framework-agnostic (Web Request/Response). */
export async function handleSearchRequest(
  request: Request,
  config: Config.Config,
): Promise<Response> {
  const publicConfig = fromConfig(config)
  if (!publicConfig || !config._retriever)
    return json({ error: 'Retriever search not enabled' }, 404)

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) return json({ error: 'Missing `query`' }, 400)
  if (query.length > 512) return json({ error: '`query` too long (max 512)' }, 400)

  const limit =
    typeof body.limit === 'number' ? Math.max(1, Math.min(20, Math.floor(body.limit))) : undefined

  try {
    const t0 = Date.now()
    const results = await retrieve(config, { limit, query })
    const searchMs = Date.now() - t0
    return json({ results, timings: { searchMs } }, 200, { 'Cache-Control': 'no-store' })
  } catch (error) {
    console.error('[vocs] retriever search failed:', error)
    return json({ error: 'Search failed' }, 503)
  }
}

function requirePrivate(config: Config.Config): PrivateConfig {
  if (!config._retriever)
    throw new Error('[vocs] retriever is not configured (missing `_retriever`)')
  return config._retriever
}

function json(data: unknown, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...headers },
    status,
  })
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function deriveHref(key: string | undefined): string | undefined {
  if (!key) return undefined
  if (/^https?:\/\//.test(key)) return key
  let href = key.replace(/\.(mdx?|html?|txt)$/i, '').replace(/\/index$/, '')
  if (!href.startsWith('/')) href = `/${href}`
  return href
}

/** Splits a URL or object key into clean path segments (host/ext/`index` dropped). */
function pathSegments(urlOrKey: string | undefined): string[] {
  if (!urlOrKey) return []
  let path = urlOrKey.replace(/[?#].*$/, '')
  const hostMatch = path.match(/^https?:\/\/[^/]+(\/.*)?$/i)
  if (hostMatch) path = hostMatch[1] ?? ''
  return path
    .replace(/\.(mdx?|html?|txt)$/i, '')
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment.toLowerCase() !== 'index')
}

/** Extracts the host from a URL (`https://docs.x.com/a` → `docs.x.com`), else undefined. */
function hostname(url: string): string | undefined {
  return url.match(/^https?:\/\/([^/]+)/i)?.[1]
}

/** Turns a slug segment (`use-accounts`) into a display title (`Use Accounts`). */
function humanize(segment: string): string {
  return segment
    .replace(/\.(mdx?|html?|txt)$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500)
  } catch {
    return '<no body>'
  }
}
