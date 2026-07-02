/**
 * Retriever abstraction for Vocs AI search.
 *
 * A retriever turns a query into a ranked list of results. Vocs ships two kinds:
 *
 * - {@link local} — self-owned: Vocs builds and hosts a static vector index at
 *   build time (reuse keyword-search documents → chunk → embed, cached → pack
 *   into a static vector store) and searches it at runtime. An open-source
 *   alternative to a hosted vector DB.
 * - {@link cloudflare} (and other {@link Adapter}s) — managed: retrieval is
 *   delegated to a backend (e.g. Cloudflare AI Search).
 *
 * Adapters and local providers hold secrets (API tokens/keys) and therefore must
 * only ever live in the private `_retriever` / `_localRetriever` config — never
 * in serializable config sent to the browser.
 *
 * Heavy/Node-only modules (`search`, `embedding-cache`, `node:*`) are imported
 * dynamically so this module stays light in the static graph of `config.ts`
 * (which edge `vocs/server` consumers pull in).
 */

import type * as Config from './config.js'
import * as Embedding from './embedding.js'
import type * as Reranker from './reranker.js'
import * as RetrieverSource from './retriever-source.js'
import * as VectorStore from './vector-store.js'

/** A single AI search result returned by a retriever. */
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
 * Base shape shared by every retriever, regardless of provider. Both
 * {@link local} and {@link cloudflare} extend this with their provider-specific
 * options.
 */
export type BaseRetriever = {
  /** Explicitly enable/disable AI search. Defaults to enabled when set. */
  enabled?: boolean | undefined
  /** Override the server endpoint path. @default `{basePath}/api/search` */
  endpoint?: string | undefined
  /**
   * Fuse semantic results with keyword (MiniSearch) results into a single
   * ranking. Pass an object to tune each contribution. @default false
   */
  hybrid?:
    | boolean
    | { keywordWeight?: number | undefined; semanticWeight?: number | undefined }
    | undefined
  /** Max results returned to the client. @default 8 */
  topK?: number | undefined
  /** Search dialog UI behavior. */
  ui?: { debounceMs?: number | undefined } | undefined
}

/**
 * A self-owned retriever, created by {@link local}. Vocs builds a static vector
 * index at build time (chunk → embed) and searches it at runtime — the
 * open-source alternative to a hosted vector DB. Config resolution routes it to
 * the built-in vector-search pipeline.
 */
export type LocalRetriever = { kind: 'local' } & local.Options

/**
 * A managed retriever, created by {@link cloudflare} or {@link from}. Retrieval
 * is delegated to a backend adapter; config resolution routes it to the runtime
 * `/api/search` endpoint.
 */
export type ManagedRetriever = BaseRetriever & {
  /** Retrieval adapter (holds secrets; kept server-side only). */
  adapter: Adapter
  /** Discriminant. */
  kind: 'managed'
}

/**
 * A configured retriever — the value assigned to `ai.retriever`. Create one with
 * {@link local} (self-owned) or {@link cloudflare} / {@link from} (managed).
 */
export type Retriever = LocalRetriever | ManagedRetriever

/**
 * Creates a managed retriever from a custom adapter.
 *
 * @example
 * ```ts
 * import { defineConfig, Retriever } from 'vocs/config'
 *
 * export default defineConfig({
 *   ai: {
 *     retriever: Retriever.from({
 *       type: 'custom',
 *       async retrieve(query, { limit }) { ... },
 *     }),
 *   },
 * })
 * ```
 */
export function from(adapter: Adapter, options: BaseRetriever = {}): ManagedRetriever {
  return { adapter, kind: 'managed', ...options }
}

/**
 * Creates a self-owned ({@link LocalRetriever}) retriever: Vocs builds and hosts
 * the vector index.
 *
 * @example
 * ```ts
 * import { defineConfig, Retriever, Embedding } from 'vocs/config'
 *
 * export default defineConfig({
 *   ai: { retriever: Retriever.local({ embedding: Embedding.openai() }) },
 * })
 * ```
 */
export function local(options: local.Options = {}): LocalRetriever {
  return { kind: 'local', ...options }
}
export declare namespace local {
  type Options = BaseRetriever & {
    /** On-disk embedding cache. `false` disables it. @default true */
    cache?: boolean | CacheOptions | undefined
    /** How documents are split into embeddable chunks. */
    chunking?: ChunkingOptions | undefined
    /** Embedding adapter (holds secrets; server-side only). */
    embedding?: Embedding.Adapter | undefined
    /**
     * Optional cross-encoder reranker applied to the top candidates after vector
     * retrieval to boost precision. Adds one model call per query. Server-side.
     */
    reranker?: Reranker.Adapter | undefined
    /** Where retrieval runs. `'auto'` → `'server'`; `'client'` is reserved (not implemented yet). @default 'server' */
    runtime?: 'auto' | 'server' | 'client' | undefined
    /**
     * External source URLs embedded alongside local docs. Each URL is fetched at
     * build time and auto-expanded: a `sitemap.xml` to every page it lists, an
     * `llms.txt` to every same-origin page it links, anything else to the page
     * itself.
     */
    sources?: readonly (string | RetrieverSource.Source)[] | undefined
    /** Vector store. @default VectorStore.static() */
    vectorStore?: VectorStore.Adapter | undefined
  }
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
 * Cloudflare AI Search retriever. Calls the managed
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
 *   ai: { retriever: Retriever.cloudflare({ instance: 'my-docs' }) },
 * })
 * ```
 */
export function cloudflare(options: cloudflare.Options): ManagedRetriever {
  const {
    accountId = process.env['CLOUDFLARE_ACCOUNT_ID'],
    apiToken = process.env['CLOUDFLARE_API_TOKEN'],
    baseUrl = 'https://api.cloudflare.com/client/v4',
    enabled,
    endpoint,
    filters,
    headers,
    hybrid,
    instance,
    mapResult,
    namespace,
    reranking,
    retrievalType,
    rewriteQuery = false,
    scoreThreshold,
    topK,
    ui,
  } = options
  const adapter: Adapter = {
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
  return { adapter, kind: 'managed', enabled, endpoint, hybrid, topK, ui }
}

export declare namespace cloudflare {
  type Options = BaseRetriever & {
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

/**
 * Splits an `ai.retriever` value into the internal inputs consumed by config
 * resolution: a `local` input (routed to the built-in vector pipeline) or a
 * `managed` retriever (routed to the runtime retrieval endpoint). Returns `{}`
 * when no retriever is configured.
 */
export function normalize(input: Retriever | undefined): normalize.ReturnType {
  if (!input) return {}
  if (input.kind === 'managed') return { managed: input }

  // Local: map the shared `hybrid`/`topK` knobs onto the local `retrieval`
  // options, and pass the rest of the local options straight through.
  const { hybrid, kind: _kind, topK, ...rest } = input
  const retrieval = toRetrieval(hybrid, topK)
  const local: Input = { ...rest, ...(retrieval ? { retrieval } : {}) }
  return { local }
}
export declare namespace normalize {
  type ReturnType = {
    local?: Input | undefined
    managed?: ManagedRetriever | undefined
  }
}

/** Maps the shared `hybrid`/`topK` knobs onto the local `retrieval` options. */
function toRetrieval(
  hybrid: BaseRetriever['hybrid'],
  topK: number | undefined,
): RetrievalOptions | undefined {
  const retrieval: RetrievalOptions = {}
  if (topK !== undefined) retrieval.topK = topK
  if (hybrid !== undefined) {
    retrieval.hybrid = hybrid !== false
    if (typeof hybrid === 'object' && hybrid) {
      if (hybrid.keywordWeight !== undefined) retrieval.keywordWeight = hybrid.keywordWeight
      if (hybrid.semanticWeight !== undefined) retrieval.semanticWeight = hybrid.semanticWeight
    }
  }
  return Object.keys(retrieval).length > 0 ? retrieval : undefined
}

/** Serializable retriever config — safe to send to the browser. */
export type PublicConfig = {
  /** Whether AI search is enabled. */
  enabled: boolean
  /** Server endpoint path that runs retrieval. */
  endpoint: string
  /** Fuse keyword + semantic results into one ranking (done client-side). */
  hybrid: {
    /** Whether hybrid fusion is enabled. */
    enabled: boolean
    /** Weight applied to keyword (MiniSearch) results during fusion. */
    keywordWeight: number
    /** Weight applied to semantic results during fusion. */
    semanticWeight: number
  }
  /** Where retrieval runs (local provider only). */
  runtime?: 'server' | 'client' | undefined
  /** Client UI behavior for the search dialog. */
  ui: {
    /** Debounce before firing a semantic request (ms). */
    debounceMs: number
  }
}

/**
 * Reads the resolved public AI config off a Config, or `undefined`.
 *
 * The self-owned and managed providers share this public shape under
 * `ai.retriever`; the caller (endpoint handler) narrows to its provider via the
 * private `config._localRetriever` / `config._retriever`.
 */
export function fromConfig(config: Config.Config): PublicConfig | undefined {
  const retriever = (config as { ai?: { retriever?: unknown } }).ai?.retriever
  if (
    retriever &&
    typeof retriever === 'object' &&
    'enabled' in retriever &&
    (retriever as PublicConfig).enabled
  )
    return retriever as PublicConfig
  return undefined
}

/**
 * Loads a prebuilt {@link IndexManifest} from outside the module — e.g. the
 * manifest baked into the server bundle at build time (see the
 * `virtual:vocs/ai-search-manifest` module). Returning `undefined` falls back
 * to the on-disk manifest, then to an in-process build.
 */
export type ManifestLoader = () => Promise<IndexManifest | undefined>

/**
 * Handles `POST /api/search`. Framework-agnostic (Web Request/Response).
 *
 * Dispatches to whichever provider is configured — the self-owned local vector
 * index (`config._localRetriever`) or a managed retriever (`config._retriever`). Exactly
 * one resolves, so the single endpoint serves both.
 */
export async function handleSearchRequest(
  request: Request,
  config: Config.Config,
  options: handleSearchRequest.Options = {},
): Promise<Response> {
  if (config._localRetriever) return handleLocalSearchRequest(request, config, options)
  if (config._retriever) return handleManagedSearchRequest(request, config)
  return json({ error: 'AI search not enabled' }, 404)
}

export declare namespace handleSearchRequest {
  type Options = {
    /** Source of the prebuilt manifest (e.g. baked into the server bundle). */
    loadManifest?: ManifestLoader | undefined
  }
}

/**
 * Retrieves AI search results for a query with whichever provider is
 * configured, awaiting the index when needed (unlike the `/api/search`
 * endpoint, which answers `202` while it loads). Returns `[]` when AI search
 * is not enabled or the index is empty.
 */
export async function retrieve(
  config: Config.Config,
  options: retrieve.Options,
): Promise<Result[]> {
  const { limit, loadManifest, query, signal } = options
  if (config._localRetriever) {
    await getServerIndex(config, { loadManifest })
    return retrieveLocal(config, { limit, query })
  }
  if (config._retriever) return retrieveManaged(config, { limit, query, signal })
  return []
}

export declare namespace retrieve {
  type Options = {
    /** Max results to return. @default topK */
    limit?: number | undefined
    /** Source of the prebuilt manifest (e.g. baked into the server bundle). */
    loadManifest?: ManifestLoader | undefined
    /** Search query. */
    query: string
    /** Optional abort signal (managed retrievers only). */
    signal?: AbortSignal | undefined
  }
}

//
// Managed retriever (delegated to a backend adapter)
//

/** Server-only managed-retriever config — holds the adapter/secrets, never serialized. */
export type ManagedPrivateConfig = {
  /** Retrieval adapter used to fetch results. */
  adapter: Adapter
  /** Max results returned to the client. */
  topK: number
}

/**
 * Splits a managed retriever into a public (serializable) config and a private
 * (server-only) config. Returns `undefined` when disabled.
 */
export function resolveManaged(
  retriever: ManagedRetriever | undefined,
  ctx: resolveManaged.Context,
): resolveManaged.ReturnType {
  if (!retriever) return undefined
  if (retriever.enabled === false) return undefined

  const adapter = retriever.adapter
  if (!adapter) {
    console.warn(
      '[vocs] ai.retriever (managed) is enabled but no adapter was provided. AI search disabled.',
    )
    return undefined
  }

  const basePath = ctx.basePath.endsWith('/') ? ctx.basePath.slice(0, -1) : ctx.basePath
  const endpoint = retriever.endpoint ?? `${basePath}/api/search`
  const hybrid = retriever.hybrid
  const hybridObj = typeof hybrid === 'object' && hybrid ? hybrid : {}

  const publicConfig: PublicConfig = {
    enabled: true,
    endpoint,
    hybrid: {
      enabled: Boolean(hybrid),
      keywordWeight: hybridObj.keywordWeight ?? 0.3,
      semanticWeight: hybridObj.semanticWeight ?? 0.7,
    },
    ui: { debounceMs: retriever.ui?.debounceMs ?? 250 },
  }
  const privateConfig: ManagedPrivateConfig = { adapter, topK: retriever.topK ?? 8 }

  return { private: privateConfig, public: publicConfig }
}

export declare namespace resolveManaged {
  type Context = {
    /** Site base path, used to derive the default endpoint. */
    basePath: string
  }
  type ReturnType = { private: ManagedPrivateConfig; public: PublicConfig } | undefined
}

/** Runs the configured managed retriever, dedupes by href, and caps at `limit`. */
export async function retrieveManaged(
  config: Config.Config,
  options: retrieveManaged.Options,
): Promise<Result[]> {
  const priv = requireManaged(config)
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

export declare namespace retrieveManaged {
  type Options = {
    /** Max results to return. @default topK */
    limit?: number | undefined
    /** Search query. */
    query: string
    /** Optional abort signal. */
    signal?: AbortSignal | undefined
  }
}

/** Managed branch of {@link handleSearchRequest}. */
async function handleManagedSearchRequest(
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
    const results = await retrieveManaged(config, { limit, query })
    const searchMs = Date.now() - t0
    return json({ results, timings: { searchMs } }, 200, { 'Cache-Control': 'no-store' })
  } catch (error) {
    console.error('[vocs] retriever search failed:', error)
    return json({ error: 'Search failed' }, 503)
  }
}

function requireManaged(config: Config.Config): ManagedPrivateConfig {
  if (!config._retriever)
    throw new Error('[vocs] retriever is not configured (missing `_retriever`)')
  return config._retriever
}

//
// Local retriever (self-owned static vector index)
//

export type ChunkingOptions = {
  /** Prepend parent breadcrumbs/category to the embedded text. @default true */
  includeBreadcrumbs?: boolean | undefined
  /** Prepend the section heading to the embedded text. @default true */
  includeHeadings?: boolean | undefined
  /** Include external nav links (usually text-less) in the index. @default false */
  includeNav?: boolean | undefined
  /** Target maximum characters per chunk. @default 1200 */
  maxCharacters?: number | undefined
  /** Characters of overlap between adjacent chunks of the same document. @default 160 */
  overlapCharacters?: number | undefined
}

export type RetrievalOptions = {
  /** Candidates scored before dedupe/rerank. @default 40 */
  candidateK?: number | undefined
  /** Fuse with keyword search. @default false */
  hybrid?: boolean | undefined
  /** Keyword weight for hybrid fusion. @default 0.3 */
  keywordWeight?: number | undefined
  /** Semantic weight for hybrid fusion. @default 0.7 */
  semanticWeight?: number | undefined
  /** Results returned to the client. @default 8 */
  topK?: number | undefined
}

export type CacheOptions = {
  /** Cache directory. @default `{config.cacheDir}/ai-search` */
  dir?: string | undefined
  /** Enable the on-disk embedding cache. @default true */
  enabled?: boolean | undefined
  /** Skip reading/writing the cache. @default process.env.VOCS_AI_CACHE_IGNORE */
  ignore?: boolean | undefined
}

export type UiOptions = {
  /** Debounce before firing a semantic request (ms). @default 250 */
  debounceMs?: number | undefined
}

/** Internal local-provider input, normalized from `ai.retriever`. */
export type Input =
  | boolean
  | {
      /** On-disk embedding cache. `false` disables it. @default true */
      cache?: boolean | CacheOptions | undefined
      /** How documents are split into embeddable chunks. */
      chunking?: ChunkingOptions | undefined
      /** Embedding adapter (required unless using the `true` shorthand). */
      embedding?: Embedding.Adapter | undefined
      /** Explicitly enable/disable. Defaults to enabled when the object is present. */
      enabled?: boolean | undefined
      /** Override the server endpoint path. @default `{basePath}/api/search` */
      endpoint?: string | undefined
      /**
       * Optional cross-encoder reranker ("search model") applied to the top
       * candidates after vector retrieval to boost precision. Adds one model
       * call per query. Server-side only.
       */
      reranker?: Reranker.Adapter | undefined
      /** How candidates are fetched and ranked. */
      retrieval?: RetrievalOptions | undefined
      /** Where retrieval runs. `'auto'` → `'server'`; `'client'` is reserved (not implemented yet). @default 'server' */
      runtime?: 'auto' | 'server' | 'client' | undefined
      /**
       * External source URLs to embed alongside local docs. Each URL is fetched
       * at build time and auto-expanded: a `sitemap.xml` → every page it lists,
       * an `llms.txt` → every same-origin page it links, anything else → the
       * page itself. Results link out to their absolute URL.
       */
      sources?: readonly (string | RetrieverSource.Source)[] | undefined
      /** Search dialog UI behavior. */
      ui?: UiOptions | undefined
      /** Vector store. @default VectorStore.static() */
      vectorStore?: VectorStore.Adapter | undefined
    }

type ResolvedChunking = { [K in keyof ChunkingOptions]-?: NonNullable<ChunkingOptions[K]> }
type ResolvedRetrieval = { [K in keyof RetrievalOptions]-?: NonNullable<RetrievalOptions[K]> }

/** Server-only local-provider config — holds adapters/secrets, never serialized. */
export type LocalPrivateConfig = {
  /** On-disk embedding cache settings. */
  cache: {
    /** Cache directory, or `undefined` for the default. */
    dir: string | undefined
    /** Whether the cache is enabled. */
    enabled: boolean
    /** Skip reading/writing the cache. */
    ignore: boolean
  }
  /** Resolved chunking options. */
  chunking: ResolvedChunking
  /** Embedding adapter used to vectorize chunks and queries. */
  embedding: Embedding.Adapter
  /** Optional cross-encoder reranker applied to top candidates. */
  reranker: Reranker.Adapter | undefined
  /** Resolved retrieval options. */
  retrieval: ResolvedRetrieval
  /** Where retrieval runs. */
  runtime: 'server' | 'client'
  /** External sources embedded alongside local docs. */
  sources: readonly (string | RetrieverSource.Source)[]
  /** Vector store implementation backing the index. */
  vectorStore: VectorStore.Adapter
}

/**
 * Splits the internal local input into a public (serializable) config and a
 * private (server-only) config. Returns `undefined` when the local provider is
 * disabled.
 */
export function resolveLocal(
  input: Input | undefined,
  ctx: resolveLocal.Context,
): resolveLocal.ReturnType {
  if (!input) return undefined
  const options = input === true ? {} : input
  if (options.enabled === false) return undefined

  const embedding = options.embedding ?? (input === true ? Embedding.ollama() : undefined)
  if (!embedding) {
    console.warn(
      '[vocs] ai.retriever (local) is enabled but no `embedding` adapter was provided. AI search disabled.',
    )
    return undefined
  }

  let runtime = options.runtime && options.runtime !== 'auto' ? options.runtime : 'server'
  if (runtime === 'client') {
    console.warn(
      "[vocs] ai.retriever: `runtime: 'client'` is not implemented yet. Falling back to `'server'`.",
    )
    runtime = 'server'
  }
  const vectorStore = options.vectorStore ?? VectorStore.static()

  const ui = options.ui ?? {}
  const cacheInput = options.cache
  const cache = (() => {
    if (cacheInput === false) return { enabled: false, dir: undefined, ignore: true }
    const obj = typeof cacheInput === 'object' && cacheInput ? cacheInput : {}
    return {
      enabled: obj.enabled ?? true,
      dir: obj.dir,
      ignore: obj.ignore ?? Boolean(process.env['VOCS_AI_CACHE_IGNORE']),
    }
  })()

  const basePath = ctx.basePath.endsWith('/') ? ctx.basePath.slice(0, -1) : ctx.basePath
  const endpoint = options.endpoint ?? `${basePath}/api/search`

  const publicConfig: PublicConfig = {
    enabled: true,
    runtime,
    endpoint,
    hybrid: {
      enabled: options.retrieval?.hybrid ?? false,
      semanticWeight: options.retrieval?.semanticWeight ?? 0.7,
      keywordWeight: options.retrieval?.keywordWeight ?? 0.3,
    },
    ui: {
      debounceMs: ui.debounceMs ?? 250,
    },
  }

  // Overlap must stay below the max so the splitter always advances.
  const maxCharacters = Math.max(1, options.chunking?.maxCharacters ?? 1200)
  const overlapCharacters = Math.min(
    Math.max(0, options.chunking?.overlapCharacters ?? 160),
    maxCharacters - 1,
  )

  const privateConfig: LocalPrivateConfig = {
    runtime,
    embedding,
    reranker: options.reranker,
    sources: options.sources ?? [],
    vectorStore,
    chunking: {
      maxCharacters,
      overlapCharacters,
      includeHeadings: options.chunking?.includeHeadings ?? true,
      includeBreadcrumbs: options.chunking?.includeBreadcrumbs ?? true,
      includeNav: options.chunking?.includeNav ?? false,
    },
    retrieval: {
      topK: options.retrieval?.topK ?? 8,
      candidateK: options.retrieval?.candidateK ?? 40,
      hybrid: options.retrieval?.hybrid ?? false,
      semanticWeight: options.retrieval?.semanticWeight ?? 0.7,
      keywordWeight: options.retrieval?.keywordWeight ?? 0.3,
    },
    cache,
  }

  return { public: publicConfig, private: privateConfig }
}

export declare namespace resolveLocal {
  type Context = {
    /** Site base path, used to derive the default endpoint. */
    basePath: string
  }
  type ReturnType = { public: PublicConfig; private: LocalPrivateConfig } | undefined
}

export type Chunk = {
  /** Top-level category the chunk belongs to. */
  category: string
  /** Text actually sent to the embedder (with heading/breadcrumb context). */
  embeddingText: string
  /** URL of the source page/section. */
  href: string
  /** Unique chunk id (`{docId}` or `{docId}::{index}` when split). */
  id: string
  /** Display text (original section text for this chunk). */
  text: string
  /** Title of the source page/section. */
  title: string
  /** Ancestor section titles (breadcrumb trail). */
  titles: string[]
  /** Kind of source document. */
  type: 'page' | 'section' | 'nav'
  /** Score multiplier applied at ranking time. @default 1 */
  weight?: number | undefined
}

type Document = {
  category: string
  href: string
  id: string
  searchPriority: number | undefined
  subtitle: string
  text: string
  title: string
  titles: string[]
  type: 'page' | 'section' | 'nav'
  weight?: number | undefined
}

/** Splits search documents into embeddable chunks. */
export function chunk(documents: readonly Document[], options: ResolvedChunking): Chunk[] {
  const chunks: Chunk[] = []
  for (const doc of documents) {
    if (doc.type === 'nav' && !options.includeNav) continue
    const body = doc.text.trim()
    if (!body && doc.type !== 'page') continue

    const pieces = splitText(body, options.maxCharacters, options.overlapCharacters)
    const safePieces = pieces.length > 0 ? pieces : ['']

    const contextLines: string[] = []
    if (options.includeBreadcrumbs && doc.category) contextLines.push(doc.category)
    if (options.includeBreadcrumbs && doc.titles.length) contextLines.push(doc.titles.join(' > '))
    if (options.includeHeadings && doc.title) contextLines.push(doc.title)
    const prefix = contextLines.join('\n')

    safePieces.forEach((piece, index) => {
      const text = piece || doc.title
      chunks.push({
        id: safePieces.length > 1 ? `${doc.id}::${index}` : doc.id,
        href: doc.href,
        title: doc.title,
        titles: doc.titles,
        category: doc.category,
        type: doc.type,
        weight: doc.weight,
        text,
        embeddingText: prefix ? `${prefix}\n\n${text}` : text,
      })
    })
  }
  return chunks
}

/** Greedy paragraph-aware splitter with character overlap. */
function splitText(text: string, max: number, overlap: number): string[] {
  if (text.length <= max) return text ? [text] : []
  const paragraphs = text.split(/\n{2,}/)
  const out: string[] = []
  let current = ''
  const push = () => {
    const trimmed = current.trim()
    if (trimmed) out.push(trimmed)
  }
  // Guard the stride so a misconfigured overlap can never stall the loop.
  const step = Math.max(1, max - overlap)
  for (const para of paragraphs) {
    if (para.length > max) {
      push()
      current = ''
      for (let i = 0; i < para.length; i += step) out.push(para.slice(i, i + max).trim())
      continue
    }
    if (current.length + para.length + 2 > max) {
      push()
      const tail = overlap > 0 ? current.slice(-overlap) : ''
      current = `${tail}${tail ? '\n\n' : ''}${para}`
    } else {
      current = current ? `${current}\n\n${para}` : para
    }
  }
  push()
  return out
}

export type ChunkMetadata = {
  /** Top-level category the chunk belongs to. */
  category: string
  /** URL of the source page/section. */
  href: string
  /** Unique chunk id. */
  id: string
  /** Short preview text shown in results. */
  snippet: string
  /** Full display text — present in the server artifact, stripped for the browser. */
  text?: string | undefined
  /** Title of the source page/section. */
  title: string
  /** Ancestor section titles (breadcrumb trail). */
  titles: string[]
  /** Kind of source document. */
  type: 'page' | 'section' | 'nav'
  /** Score multiplier applied at ranking time (omitted when `1`). */
  weight?: number | undefined
}

export type IndexManifest = {
  /** Per-chunk metadata, index-aligned with the vectors. */
  chunks: ChunkMetadata[]
  /** Embedding model metadata used to build the index. */
  embedding: {
    /** Vector dimensionality. */
    dimensions: number
    /** Model identifier. */
    model: string
    /** Always true — vectors are L2-normalized at build time. */
    normalized: true
    /** Adapter type (e.g. `'openai'`). */
    type: string
  }
  /** Packed vector store metadata. */
  vectorStore: {
    /** Number of vectors. */
    count: number
    /** Vector dimensionality. */
    dimensions: number
    /** Storage format of the packed vectors. */
    format: VectorStore.Format
  }
  /** Packed vector data. */
  vectors: VectorStore.Packed
  /** Manifest schema version. */
  version: 1
}

/**
 * A build-progress event emitted by {@link buildIndex}, in pipeline order:
 * `documents` → (`sources:start` → `sources:progress`* → `sources:done`) →
 * `chunked` → `embed:start` → `embed:progress`* → `packed`.
 */
export type ProgressEvent =
  | { type: 'documents'; local: number }
  | { type: 'sources:start'; sources: number }
  | { type: 'sources:progress'; done: number; total: number }
  | { type: 'sources:done'; pages: number }
  | { type: 'chunked'; chunks: number }
  | { type: 'embed:start'; cached: number; toEmbed: number; total: number }
  | { type: 'embed:progress'; embedded: number; toEmbed: number }
  | { type: 'packed'; dimensions: number; format: VectorStore.Format }

export declare namespace buildIndex {
  type Options = {
    /** Called with build-progress events for logging/introspection. */
    onProgress?: ((event: ProgressEvent) => void) | undefined
  }
}

/**
 * Fetches external source URLs and maps them to the local {@link Document} shape
 * so they can be chunked and embedded alongside the site's own docs. URLs are
 * auto-expanded (sitemap / llms.txt / page) at build time and never recurse into
 * in-page links; failures on individual pages are skipped, not fatal.
 */
async function loadExternalDocuments(
  sources: readonly (string | RetrieverSource.Source)[],
  onProgress?: ((event: ProgressEvent) => void) | undefined,
): Promise<Document[]> {
  if (sources.length === 0) return []
  const external = await RetrieverSource.load(sources, {
    onProgress: (done, total) => onProgress?.({ type: 'sources:progress', done, total }),
  })
  return external.map((doc) => ({
    id: doc.href,
    href: doc.href,
    title: doc.title,
    titles: [],
    // The source's `label` (empty → the search UI falls back to the hostname).
    category: doc.label ?? '',
    subtitle: '',
    searchPriority: undefined,
    // External sources are slightly de-prioritized vs. local docs by default.
    weight: doc.weight ?? 0.9,
    text: doc.text,
    type: 'page',
  }))
}

/**
 * Builds the static vector index from a resolved config. Uses the embedding
 * cache so unchanged chunks are not re-embedded.
 */
export async function buildIndex(
  config: Config.Config,
  options: buildIndex.Options = {},
): Promise<IndexManifest> {
  const { onProgress } = options
  const priv = requireLocal(config)
  const [Search, EmbeddingCache, nodePath] = await Promise.all([
    import('./search.js'),
    import('./embedding-cache.js'),
    import('node:path'),
  ])

  const documents = (await Search.SearchDocuments.fromConfig(config)) as Document[]
  onProgress?.({ type: 'documents', local: documents.length })

  if (priv.sources.length > 0) onProgress?.({ type: 'sources:start', sources: priv.sources.length })
  const external = await loadExternalDocuments(priv.sources, onProgress)
  if (priv.sources.length > 0) onProgress?.({ type: 'sources:done', pages: external.length })

  const chunks = chunk([...documents, ...external], priv.chunking)
  onProgress?.({ type: 'chunked', chunks: chunks.length })

  const cacheDir = priv.cache.dir ?? nodePath.join(config.cacheDir, 'ai-search')
  const cache = EmbeddingCache.load({
    dir: cacheDir,
    ignore: priv.cache.ignore || !priv.cache.enabled,
  })

  const vectors = await embedChunks(chunks, priv, cache, EmbeddingCache, onProgress)
  cache.save()

  const dimensions = vectors[0]?.length ?? priv.embedding.dimensions ?? 0
  const format = VectorStore.resolveFormat(priv.vectorStore.format, priv.runtime)
  const packed = VectorStore.pack(vectors, format)
  onProgress?.({ type: 'packed', format, dimensions })

  return {
    version: 1,
    embedding: {
      type: priv.embedding.type,
      model: priv.embedding.model,
      dimensions,
      normalized: true,
    },
    vectorStore: { format, count: chunks.length, dimensions },
    chunks: chunks.map((c) => ({
      id: c.id,
      href: c.href,
      title: c.title,
      titles: c.titles,
      category: c.category,
      type: c.type,
      snippet: c.text.slice(0, 240),
      text: c.text,
      ...(c.weight !== undefined && c.weight !== 1 ? { weight: c.weight } : {}),
    })),
    vectors: packed,
  }
}

/** Canonical on-disk path for the prebuilt server index manifest. */
async function indexFilePath(config: Config.Config): Promise<string> {
  const nodePath = await import('node:path')
  return nodePath.join(config.cacheDir, 'ai-search', 'index.json')
}

/**
 * Persists a built manifest to the canonical cache path so `vocs dev` can load
 * it without rebuilding. Written by `vocs embeddings generate` and `vocs build`.
 */
export async function saveIndex(config: Config.Config, manifest: IndexManifest): Promise<string> {
  const [fs, nodePath] = await Promise.all([import('node:fs/promises'), import('node:path')])
  const file = await indexFilePath(config)
  await fs.mkdir(nodePath.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(manifest), 'utf-8')
  return file
}

/** Reads the raw prebuilt manifest from the canonical cache path, if present. */
export async function loadIndex(config: Config.Config): Promise<IndexManifest | undefined> {
  const fs = await import('node:fs/promises')
  const file = await indexFilePath(config)
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8')) as IndexManifest
  } catch {
    return undefined
  }
}

/** Whether a manifest no longer matches the configured embedding. */
function isStale(manifest: IndexManifest, priv: LocalPrivateConfig): boolean {
  return (
    manifest.embedding.type !== priv.embedding.type ||
    manifest.embedding.model !== priv.embedding.model ||
    (priv.embedding.dimensions !== undefined &&
      manifest.embedding.dimensions !== priv.embedding.dimensions)
  )
}

/**
 * Loads the prebuilt manifest and validates it against the current embedding
 * config. Returns the manifest, or the reason it can't be used.
 */
async function loadPrebuiltIndex(
  config: Config.Config,
  priv: LocalPrivateConfig,
): Promise<IndexManifest | 'missing' | 'stale'> {
  const manifest = await loadIndex(config)
  if (!manifest) return 'missing'
  if (isStale(manifest, priv)) return 'stale'
  return manifest
}

const warnedKeys = new Set<string>()
function warnOnce(key: string, message: string): void {
  if (warnedKeys.has(key)) return
  warnedKeys.add(key)
  console.warn(message)
}

async function embedChunks(
  chunks: readonly Chunk[],
  priv: LocalPrivateConfig,
  cache: { get: (k: string) => number[] | undefined; set: (k: string, v: number[]) => void },
  EmbeddingCache: typeof import('./embedding-cache.js'),
  onProgress?: ((event: ProgressEvent) => void) | undefined,
): Promise<Float32Array[]> {
  const vectors = new Array<Float32Array>(chunks.length)
  const keys = chunks.map((c) =>
    EmbeddingCache.key({
      adapterType: priv.embedding.type,
      model: priv.embedding.model,
      dimensions: priv.embedding.dimensions,
      chunking: priv.chunking,
      text: c.embeddingText,
    }),
  )

  // Resolve cache hits; collect misses to embed in batches.
  const misses: { index: number; key: string; text: string }[] = []
  for (let i = 0; i < chunks.length; i++) {
    const key = keys[i]
    const chunk = chunks[i]
    if (!key || !chunk) continue
    const hit = cache.get(key)
    if (hit) vectors[i] = VectorStore.normalize(hit)
    else misses.push({ index: i, key, text: chunk.embeddingText })
  }

  onProgress?.({
    type: 'embed:start',
    total: chunks.length,
    cached: chunks.length - misses.length,
    toEmbed: misses.length,
  })

  const batchSize = priv.embedding.maxBatchSize ?? 256
  let embeddedCount = 0
  for (let i = 0; i < misses.length; i += batchSize) {
    const batch = misses.slice(i, i + batchSize)
    const embedded = await priv.embedding.embed(
      batch.map((m) => m.text),
      { purpose: 'document' },
    )
    batch.forEach((m, j) => {
      const raw = embedded[j]
      if (!raw) throw new Error('[vocs] embedding provider returned fewer vectors than requested')
      cache.set(m.key, [...raw])
      vectors[m.index] = VectorStore.normalize(raw)
    })
    embeddedCount += batch.length
    onProgress?.({ type: 'embed:progress', embedded: embeddedCount, toEmbed: misses.length })
  }

  return vectors
}

type ServerIndex = {
  store: VectorStore.Store
  chunks: ChunkMetadata[]
}

type ServerIndexEntry = {
  /** Set when `status` is `'error'`; gates rebuild attempts. */
  failedAt?: number | undefined
  /** Resolves to the built in-process index. */
  promise: Promise<ServerIndex>
  /** Build state (so callers can avoid blocking or retrying). */
  status: 'pending' | 'ready' | 'error'
}

const serverIndexCache = new Map<string, ServerIndexEntry>()

/** Minimum wait before a failed index build may be retried. */
const failedBuildRetryMs = 30_000

function indexCacheKey(config: Config.Config, priv: LocalPrivateConfig): string {
  return `${config.rootDir}:${priv.embedding.type}:${priv.embedding.model}`
}

/**
 * Starts (or reuses) the background build of the in-process server index and
 * returns its tracking entry. Never blocks: inspect `entry.status` to decide
 * whether to await `entry.promise` or respond immediately.
 *
 * A failed build is kept (as `'error'`) for {@link failedBuildRetryMs} before
 * it may be retried, so client polling can't trigger a rebuild per request.
 */
export function ensureServerIndex(
  config: Config.Config,
  options: ensureServerIndex.Options = {},
): ServerIndexEntry {
  const priv = requireLocal(config)
  const cacheKey = indexCacheKey(config, priv)
  let entry = serverIndexCache.get(cacheKey)
  if (entry?.status === 'error' && Date.now() - (entry.failedAt ?? 0) >= failedBuildRetryMs) {
    serverIndexCache.delete(cacheKey)
    entry = undefined
  }
  if (!entry) {
    const created: ServerIndexEntry = { status: 'pending', promise: undefined as never }
    created.promise = resolveServerIndex(config, priv, options.loadManifest)
      .then((index) => {
        created.status = 'ready'
        return index
      })
      .catch((error) => {
        created.status = 'error'
        created.failedAt = Date.now()
        console.error('[vocs] AI search index build failed:', error)
        throw error
      })
    entry = created
    serverIndexCache.set(cacheKey, entry)
  }
  return entry
}

export declare namespace ensureServerIndex {
  type Options = {
    /** Source of the prebuilt manifest (e.g. baked into the server bundle). */
    loadManifest?: ManifestLoader | undefined
  }
}

/**
 * Produces the in-process server index.
 *
 * Prefers the prebuilt manifest written by `vocs embeddings generate` / `vocs
 * build` — a request-time build refetches every external source and re-embeds
 * cache misses, so it is the fallback, not the default.
 *
 * - Development (Vite dev server): load-only. When the prebuilt index is
 *   missing or stale it resolves to an empty index (with a one-time warning),
 *   so AI search quietly falls back to keyword search.
 * - Production runtime (and `vocs preview`, tests): builds on demand when no
 *   usable prebuilt manifest ships with the deploy, warmed by the on-disk
 *   embedding cache when present.
 */
async function resolveServerIndex(
  config: Config.Config,
  priv: LocalPrivateConfig,
  loadManifest?: ManifestLoader | undefined,
): Promise<ServerIndex> {
  // Baked-in manifest first (emitted into the server bundle at build time) —
  // serverless filesystems don't carry the cache directory or source pages, so
  // this is the only source that works everywhere.
  if (loadManifest) {
    try {
      const manifest = await loadManifest()
      if (manifest && !isStale(manifest, priv))
        return { store: VectorStore.load(manifest.vectors), chunks: manifest.chunks }
    } catch (error) {
      console.warn('[vocs] failed to load bundled AI search manifest:', error)
    }
  }

  const prebuilt = await loadPrebuiltIndex(config, priv)
  if (typeof prebuilt !== 'string')
    return { store: VectorStore.load(prebuilt.vectors), chunks: prebuilt.chunks }

  if (process.env['NODE_ENV'] === 'development') {
    warnOnce(
      indexCacheKey(config, priv),
      prebuilt === 'missing'
        ? '[vocs] No prebuilt AI search index found. Run `vocs embeddings generate` to enable AI search in dev. Falling back to keyword search.'
        : '[vocs] Prebuilt AI search index is stale (embedding config changed). Run `vocs embeddings generate` to refresh. Falling back to keyword search.',
    )
    return { store: VectorStore.load(VectorStore.pack([], 'float32')), chunks: [] }
  }

  const manifest = await buildIndex(config)
  return { store: VectorStore.load(manifest.vectors), chunks: manifest.chunks }
}

/** Lazily builds and memoizes the in-process server index (awaits the build). */
export async function getServerIndex(
  config: Config.Config,
  options: ensureServerIndex.Options = {},
): Promise<ServerIndex> {
  return ensureServerIndex(config, options).promise
}

/**
 * Builds the passage text handed to the reranker. Mirrors the embedded text
 * (breadcrumb → titles → heading → body) so the cross-encoder scores the same
 * content the vector retriever matched, letting exact heading matches win.
 */
function rerankText(meta: ChunkMetadata): string {
  const lines: string[] = []
  if (meta.category) lines.push(meta.category)
  if (meta.titles.length) lines.push(meta.titles.join(' > '))
  if (meta.title) lines.push(meta.title)
  const body = meta.text || meta.snippet
  if (body) lines.push(body)
  return lines.join('\n') || meta.title
}

/** Lowercase alphanumeric word tokens (shared by title-boost matching). */
function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? []
}

/**
 * Additive lexical boost for chunks whose title matches the query — a
 * navigational-intent signal cross-encoders under-reward.
 *
 * - exact title (same token set) → `0.25`
 * - every query token present in the title → `0.12`
 * - partial overlap → up to `0.05`, scaled by coverage
 *
 * Capped so it reorders near-ties (e.g. lifting an exact-title landing page over
 * denser prose) without overriding a decisively more relevant passage.
 */
function titleMatchBoost(queryTokens: readonly string[], title: string): number {
  if (queryTokens.length === 0) return 0
  const titleTokens = tokenize(title)
  if (titleTokens.length === 0) return 0
  const titleSet = new Set(titleTokens)
  const covered = queryTokens.filter((t) => titleSet.has(t)).length
  const coverage = covered / queryTokens.length
  if (coverage < 1) return coverage * 0.05
  // Every query token is in the title. Reward an exact title match most.
  return queryTokens.length === titleTokens.length ? 0.25 : 0.12
}

/** Embeds the query, searches the local store, dedupes by href. */
export async function retrieveLocal(
  config: Config.Config,
  options: retrieveLocal.Options,
): Promise<Result[]> {
  const priv = requireLocal(config)
  const limit = options.limit ?? priv.retrieval.topK
  const index = await getServerIndex(config)
  // Empty index (dev with no prebuilt manifest): skip the query embedding call
  // and fall back to keyword-only search on the client.
  if (index.chunks.length === 0) return []

  const embedded = await priv.embedding.embed([options.query], { purpose: 'query' })
  const raw = embedded[0]
  if (!raw) return []
  const query = VectorStore.normalize(raw)

  const hits = VectorStore.search(index.store, query, priv.retrieval.candidateK)

  // Vector candidates, paired with their chunk metadata. `score` is the raw
  // similarity; a reranker (below) may replace it with a cross-encoder score.
  let candidates = hits
    .map((hit) => {
      const meta = index.chunks[hit.index]
      return meta ? { meta, score: hit.score } : undefined
    })
    .filter((hit): hit is { meta: ChunkMetadata; score: number } => hit !== undefined)

  // Optional rerank: a cross-encoder reads each (query, passage) pair jointly
  // and re-scores the candidates for precision. On failure we keep the vector
  // order so search never breaks.
  if (priv.reranker && candidates.length > 0) {
    try {
      // Cap the pool to the reranker's per-request limit; candidates are
      // vector-ordered, so the dropped tail is the least relevant.
      const max = priv.reranker.maxBatchSize
      const pool = max && candidates.length > max ? candidates.slice(0, max) : candidates
      // Feed the cross-encoder the same context the embedding saw — breadcrumb,
      // titles, and heading — not just the section body. Otherwise an exact
      // heading match (e.g. a "Stablecoin Issuance" landing page) is invisible
      // to the reranker and gets crowded out by prose that repeats the query.
      const docs = pool.map((c) => rerankText(c.meta))
      const reranked = await priv.reranker.rerank(options.query, docs, {
        topK: pool.length,
      })
      if (reranked.length > 0)
        candidates = reranked
          .map((r) => {
            const c = pool[r.index]
            return c ? { meta: c.meta, score: r.score } : undefined
          })
          .filter((c): c is { meta: ChunkMetadata; score: number } => c !== undefined)
    } catch (error) {
      console.warn('[vocs] reranker failed; falling back to vector order:', error)
    }
  }

  // Apply per-source weights (local docs default to 1) and a lexical title
  // boost, then re-rank. Cross-encoders reward comprehensive passages over
  // short exact titles, so a query that matches a heading (navigational intent,
  // e.g. "stablecoin issuance" → the "Stablecoin Issuance" page) can otherwise
  // lose to denser prose. The boost is additive and capped, so it nudges
  // near-ties without overriding a clearly more relevant passage.
  const queryTokens = tokenize(options.query)
  const ranked = candidates
    .map(({ meta, score }) => ({
      meta,
      score: score * (meta.weight ?? 1) + titleMatchBoost(queryTokens, meta.title),
    }))
    .sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const results: Result[] = []
  for (const { meta, score } of ranked) {
    if (seen.has(meta.href)) continue
    seen.add(meta.href)
    results.push({
      id: meta.id,
      href: meta.href,
      title: meta.title,
      titles: meta.titles,
      category: meta.category,
      type: meta.type,
      snippet: meta.snippet,
      score,
    })
    if (results.length >= limit) break
  }
  return results
}

export declare namespace retrieveLocal {
  type Options = {
    /** Search query to embed and match against the index. */
    query: string
    /** Max results to return. @default retrieval.topK */
    limit?: number | undefined
  }
}

type RequestBody = {
  query?: unknown
  limit?: unknown
}

/** Local branch of {@link handleSearchRequest}. */
async function handleLocalSearchRequest(
  request: Request,
  config: Config.Config,
  options: handleSearchRequest.Options = {},
): Promise<Response> {
  const publicConfig = fromConfig(config)
  if (!publicConfig || !config._localRetriever) return json({ error: 'AI search not enabled' }, 404)

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

  // Kick off (or reuse) the in-process index. This loads the prebuilt manifest
  // when present and cold-builds otherwise — either way we never block the
  // request: while pending, respond with `indexing: true` and let the client
  // keep showing keyword results (and retry shortly). A failed build answers
  // 503 (instead of 202) so the client stops polling; the entry is retried
  // after a backoff.
  const index = ensureServerIndex(config, options)
  index.promise.catch(() => {}) // avoid unhandled rejection on the background build
  if (index.status === 'error') return json({ error: 'Search failed' }, 503)
  if (index.status === 'pending')
    return json({ results: [], indexing: true }, 202, { 'Cache-Control': 'no-store' })

  try {
    const t0 = Date.now()
    const [{ store }, results] = await Promise.all([
      index.promise,
      retrieveLocal(config, { query, limit }),
    ])
    const searchMs = Date.now() - t0

    const { type, model, dimensions } = config._localRetriever.embedding
    const reranker = config._localRetriever.reranker
    return json(
      {
        results,
        indexing: false,
        embedding: { type, model, dimensions: store.dimensions || dimensions },
        ...(reranker ? { reranker: { type: reranker.type, model: reranker.model } } : {}),
        timings: { searchMs },
      },
      200,
      { 'Cache-Control': 'no-store' },
    )
  } catch (error) {
    console.error('[vocs] AI search failed:', error)
    return json({ error: 'Search failed' }, 503)
  }
}

function requireLocal(config: Config.Config): LocalPrivateConfig {
  if (!config._localRetriever)
    throw new Error('[vocs] local retriever is not configured (missing `_localRetriever`)')
  return config._localRetriever
}

/** Test-only: clears the memoized server index cache. */
export function _resetServerIndexCache(): void {
  serverIndexCache.clear()
}

//
// Shared helpers
//

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
