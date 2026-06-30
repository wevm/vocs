/**
 * RAG (retrieval-augmented generation) search for Vocs — a built-in,
 * open-source alternative to a hosted vector DB.
 *
 * Pipeline: reuse the keyword-search documents → chunk → embed (cached) → pack
 * into a static vector store. At runtime a server endpoint embeds the query and
 * searches the local store, returning ranked semantic results.
 *
 * Heavy/Node-only modules (`search`, `rag-cache`, `node:*`) are imported
 * dynamically so this module stays light in the static graph of `config.ts`
 * (which edge `vocs/server` consumers pull in).
 */

import type * as Config from './config.js'
import * as Embedding from './embedding.js'
import * as VectorStore from './vector-store.js'

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
  /** Fuse with keyword search (reserved; not yet implemented). @default false */
  hybrid?: boolean | undefined
  /** Keyword weight for hybrid fusion. @default 0.3 */
  keywordWeight?: number | undefined
  /** Semantic weight for hybrid fusion. @default 0.7 */
  semanticWeight?: number | undefined
  /** Results returned to the client. @default 8 */
  topK?: number | undefined
}

export type CacheOptions = {
  /** Cache directory. @default `{config.cacheDir}/rag` */
  dir?: string | undefined
  /** Enable the on-disk embedding cache. @default true */
  enabled?: boolean | undefined
  /** Skip reading/writing the cache. @default process.env.VOCS_RAG_CACHE_IGNORE */
  ignore?: boolean | undefined
}

export type UiOptions = {
  /** Debounce before firing a semantic request (ms). @default 250 */
  debounceMs?: number | undefined
  /** What the dialog surfaces. @default 'both' */
  mode?: 'results' | 'ask' | 'both' | undefined
  /** Show a "Semantic" badge on RAG results. @default true */
  showBadges?: boolean | undefined
}

/** User-facing `search.rag` input. */
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
      /** Override the server endpoint path. @default `{basePath}/api/search/rag` */
      endpoint?: string | undefined
      /** How candidates are fetched and ranked. */
      retrieval?: RetrievalOptions | undefined
      /** Where retrieval runs. `'auto'` → `'server'`. @default 'server' */
      runtime?: 'auto' | 'server' | 'client' | undefined
      /** Search dialog UI behavior. */
      ui?: UiOptions | undefined
      /** Vector store. @default VectorStore.static() */
      vectorStore?: VectorStore.Adapter | undefined
    }

/** Serializable RAG config — safe to send to the browser. */
export type PublicConfig = {
  /** Whether RAG search is enabled. */
  enabled: boolean
  /** Server endpoint path that embeds the query and searches the index. */
  endpoint: string
  /** Fuse keyword + semantic results into one ranking (done client-side). */
  hybrid: {
    /** Whether hybrid fusion is enabled. */
    enabled: boolean
    /** Weight applied to keyword (MiniSearch) results during fusion. */
    keywordWeight: number
    /** Weight applied to semantic (vector) results during fusion. */
    semanticWeight: number
  }
  /** Where retrieval runs. */
  runtime: 'server' | 'client'
  /** Client UI behavior for the search dialog. */
  ui: {
    /** Debounce before firing a semantic request (ms). */
    debounceMs: number
    /** What the dialog surfaces. */
    mode: 'results' | 'ask' | 'both'
    /** Show a "Semantic" badge on RAG results. */
    showBadges: boolean
  }
}

type ResolvedChunking = { [K in keyof ChunkingOptions]-?: NonNullable<ChunkingOptions[K]> }
type ResolvedRetrieval = { [K in keyof RetrievalOptions]-?: NonNullable<RetrievalOptions[K]> }

/** Server-only RAG config — holds adapters/secrets, never serialized. */
export type PrivateConfig = {
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
  /** Resolved retrieval options. */
  retrieval: ResolvedRetrieval
  /** Where retrieval runs. */
  runtime: 'server' | 'client'
  /** Vector store implementation backing the index. */
  vectorStore: VectorStore.Adapter
}

/**
 * Splits user `search.rag` input into a public (serializable) config and a
 * private (server-only) config. Returns `undefined` when RAG is disabled.
 */
export function resolve(input: Input | undefined, ctx: resolve.Context): resolve.ReturnType {
  if (!input) return undefined
  const options = input === true ? {} : input
  if (options.enabled === false) return undefined

  const embedding = options.embedding ?? (input === true ? Embedding.ollama() : undefined)
  if (!embedding) {
    console.warn(
      '[vocs] search.rag is enabled but no `embedding` adapter was provided. RAG search disabled.',
    )
    return undefined
  }

  const runtime = options.runtime && options.runtime !== 'auto' ? options.runtime : 'server'
  const vectorStore = options.vectorStore ?? VectorStore.static()

  const ui = options.ui ?? {}
  const cacheInput = options.cache
  const cache = (() => {
    if (cacheInput === false) return { enabled: false, dir: undefined, ignore: true }
    const obj = typeof cacheInput === 'object' && cacheInput ? cacheInput : {}
    return {
      enabled: obj.enabled ?? true,
      dir: obj.dir,
      ignore: obj.ignore ?? Boolean(process.env['VOCS_RAG_CACHE_IGNORE']),
    }
  })()

  const basePath = ctx.basePath.endsWith('/') ? ctx.basePath.slice(0, -1) : ctx.basePath
  const endpoint = options.endpoint ?? `${basePath}/api/search/rag`

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
      mode: ui.mode ?? 'both',
      showBadges: ui.showBadges ?? true,
      debounceMs: ui.debounceMs ?? 250,
    },
  }

  const privateConfig: PrivateConfig = {
    runtime,
    embedding,
    vectorStore,
    chunking: {
      maxCharacters: options.chunking?.maxCharacters ?? 1200,
      overlapCharacters: options.chunking?.overlapCharacters ?? 160,
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

export declare namespace resolve {
  type Context = {
    /** Site base path, used to derive the default endpoint. */
    basePath: string
  }
  type ReturnType = { public: PublicConfig; private: PrivateConfig } | undefined
}

/** Reads the resolved public RAG config off a Config, or `undefined`. */
export function fromConfig(config: Config.Config): PublicConfig | undefined {
  const rag = (config.search as { rag?: unknown } | undefined)?.rag
  if (rag && typeof rag === 'object' && 'enabled' in rag && (rag as PublicConfig).enabled)
    return rag as PublicConfig
  return undefined
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
  /** Relative search priority carried from the source document. */
  searchPriority: number | undefined
  /** Display text (original section text for this chunk). */
  text: string
  /** Title of the source page/section. */
  title: string
  /** Ancestor section titles (breadcrumb trail). */
  titles: string[]
  /** Kind of source document. */
  type: 'page' | 'section' | 'nav'
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
        searchPriority: doc.searchPriority,
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
  for (const para of paragraphs) {
    if (para.length > max) {
      push()
      current = ''
      for (let i = 0; i < para.length; i += max - overlap) out.push(para.slice(i, i + max).trim())
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
  /** Relative search priority carried from the source document. */
  searchPriority: number | undefined
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
 * Builds the static vector index from a resolved config. Uses the embedding
 * cache so unchanged chunks are not re-embedded.
 */
export async function buildIndex(config: Config.Config): Promise<IndexManifest> {
  const priv = requirePrivate(config)
  const [Search, RagCache, nodePath] = await Promise.all([
    import('./search.js'),
    import('./rag-cache.js'),
    import('node:path'),
  ])

  const documents = (await Search.SearchDocuments.fromConfig(config)) as Document[]
  const chunks = chunk(documents, priv.chunking)

  const cacheDir = priv.cache.dir ?? nodePath.join(config.cacheDir, 'rag')
  const cache = RagCache.load({ dir: cacheDir, ignore: priv.cache.ignore || !priv.cache.enabled })

  const vectors = await embedChunks(chunks, priv, cache, RagCache)
  cache.save()

  const dimensions = vectors[0]?.length ?? priv.embedding.dimensions ?? 0
  const format = VectorStore.resolveFormat(priv.vectorStore.format, priv.runtime)
  const packed = VectorStore.pack(vectors, format)

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
      searchPriority: c.searchPriority,
      snippet: c.text.slice(0, 240),
      text: c.text,
    })),
    vectors: packed,
  }
}

async function embedChunks(
  chunks: readonly Chunk[],
  priv: PrivateConfig,
  cache: { get: (k: string) => number[] | undefined; set: (k: string, v: number[]) => void },
  RagCache: typeof import('./rag-cache.js'),
): Promise<Float32Array[]> {
  const vectors = new Array<Float32Array>(chunks.length)
  const keys = chunks.map((c) =>
    RagCache.key({
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

  const batchSize = priv.embedding.maxBatchSize ?? 256
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
  }

  return vectors
}

export type Result = {
  /** Top-level category the result belongs to. */
  category: string
  /** URL of the source page/section. */
  href: string
  /** Unique chunk id. */
  id: string
  /** Cosine similarity score in `[0, 1]` (higher is more relevant). */
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

type ServerIndex = {
  store: VectorStore.Store
  chunks: ChunkMetadata[]
}

type ServerIndexEntry = {
  /** Resolves to the built in-process index. */
  promise: Promise<ServerIndex>
  /** `true` once the build has finished (so callers can avoid blocking). */
  ready: boolean
}

const serverIndexCache = new Map<string, ServerIndexEntry>()

function indexCacheKey(config: Config.Config, priv: PrivateConfig): string {
  return `${config.rootDir}:${priv.embedding.type}:${priv.embedding.model}`
}

/**
 * Starts (or reuses) the background build of the in-process server index and
 * returns its tracking entry. Never blocks: inspect `entry.ready` to decide
 * whether to await `entry.promise` or respond immediately.
 *
 * On failure the entry is evicted so the next request retries the build.
 */
export function ensureServerIndex(config: Config.Config): ServerIndexEntry {
  const priv = requirePrivate(config)
  const cacheKey = indexCacheKey(config, priv)
  let entry = serverIndexCache.get(cacheKey)
  if (!entry) {
    const created: ServerIndexEntry = { ready: false, promise: undefined as never }
    created.promise = buildIndex(config)
      .then((manifest) => {
        created.ready = true
        return { store: VectorStore.load(manifest.vectors), chunks: manifest.chunks }
      })
      .catch((error) => {
        serverIndexCache.delete(cacheKey)
        throw error
      })
    entry = created
    serverIndexCache.set(cacheKey, entry)
  }
  return entry
}

/** Lazily builds and memoizes the in-process server index (awaits the build). */
export async function getServerIndex(config: Config.Config): Promise<ServerIndex> {
  return ensureServerIndex(config).promise
}

/** Embeds the query, searches the local store, dedupes by href. */
export async function retrieve(
  config: Config.Config,
  options: retrieve.Options,
): Promise<Result[]> {
  const priv = requirePrivate(config)
  const limit = options.limit ?? priv.retrieval.topK
  const index = await getServerIndex(config)

  const embedded = await priv.embedding.embed([options.query], { purpose: 'query' })
  const raw = embedded[0]
  if (!raw) return []
  const query = VectorStore.normalize(raw)

  const hits = VectorStore.search(index.store, query, priv.retrieval.candidateK)

  const seen = new Set<string>()
  const results: Result[] = []
  for (const hit of hits) {
    const meta = index.chunks[hit.index]
    if (!meta) continue
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
      score: hit.score,
    })
    if (results.length >= limit) break
  }
  return results
}

export declare namespace retrieve {
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

/** Handles `POST /api/search/rag`. Framework-agnostic (Web Request/Response). */
export async function handleSearchRequest(
  request: Request,
  config: Config.Config,
): Promise<Response> {
  const publicConfig = fromConfig(config)
  if (!publicConfig || !config._rag) return json({ error: 'RAG search not enabled' }, 404)

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

  // Kick off (or reuse) the index build. The first cold build embeds every
  // chunk and can take a while, so we never block the request on it: if the
  // index isn't ready, respond immediately with `indexing: true` and let the
  // client keep showing keyword results (and retry shortly).
  const index = ensureServerIndex(config)
  if (!index.ready) {
    index.promise.catch(() => {}) // avoid unhandled rejection on the background build
    return json({ results: [], indexing: true }, 202, { 'Cache-Control': 'no-store' })
  }

  try {
    const t0 = Date.now()
    const results = await retrieve(config, { query, limit })
    const searchMs = Date.now() - t0

    return json({ results, indexing: false, timings: { searchMs } }, 200, {
      'Cache-Control': 'no-store',
    })
  } catch (error) {
    console.error('[vocs] RAG search failed:', error)
    return json({ error: 'Search failed' }, 503)
  }
}

function requirePrivate(config: Config.Config): PrivateConfig {
  if (!config._rag) throw new Error('[vocs] RAG is not configured (missing `_rag`)')
  return config._rag
}

function json(data: unknown, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

/** Test-only: clears the memoized server index cache. */
export function _resetServerIndexCache(): void {
  serverIndexCache.clear()
}
