/**
 * Vector stores for AI search.
 *
 * Two storage targets:
 *
 * - `static` (default) — the built-in, open-source alternative to a hosted
 *   vector DB. Vectors are packed into a single typed-array matrix and
 *   base64-encoded, so the whole index is one compact artifact that works
 *   server-side (Node) and, with `int8` quantization, in the browser. Cosine
 *   similarity reduces to a dot product because all vectors are normalized
 *   before packing.
 * - `remote` — vectors live in a hosted vector database (e.g. Cloudflare
 *   Vectorize). The build syncs vectors up; the server queries the database at
 *   runtime, so no index artifact ships with the server bundle.
 */

export type Format = 'float32' | 'int8'

export type Adapter = StaticAdapter | RemoteAdapter

export type StaticAdapter = {
  /** Also emit a public/browser artifact (for `runtime: 'server'` deploys). */
  expose: boolean
  /** Storage format. `'auto'` resolves to `float32` (server) / `int8` (client). */
  format: 'auto' | Format
  /** Build-time warning threshold for the public artifact, in bytes. */
  maxClientBytes: number | undefined
  /** Storage target backing the adapter. */
  target: 'static'
  /** Adapter type identifier. */
  type: string
}

/** Chunk vector + metadata synced into a remote store at build time. */
export type RemoteEntry = {
  /** Stable chunk identifier (adapters may derive their own storage id). */
  id: string
  /** Chunk metadata returned verbatim by `query` at runtime. */
  metadata: Record<string, unknown>
  /** L2-normalized embedding vector. */
  vector: Float32Array
}

/** Nearest-neighbor match returned by a remote store. */
export type RemoteHit = {
  /** Storage identifier of the matched vector. */
  id: string
  /** Chunk metadata attached at sync time (if any). */
  metadata: Record<string, unknown> | undefined
  /** Similarity score (higher is more relevant). */
  score: number
}

export type RemoteSyncResult = {
  /** Stale vectors removed from the store. */
  deleted: number
  /** Vectors already up to date (not re-uploaded). */
  skipped: number
  /** New or changed vectors uploaded. */
  upserted: number
}

export type RemoteAdapter = {
  /** Returns the `topK` nearest vectors to a normalized query vector. */
  query: (
    vector: Float32Array,
    options: { signal?: AbortSignal | undefined; topK: number },
  ) => Promise<RemoteHit[]>
  /** Syncs the full chunk set into the store (upserts new, prunes stale). */
  sync: (
    entries: readonly RemoteEntry[],
    options: {
      dimensions: number
      onProgress?: ((done: number, total: number) => void) | undefined
    },
  ) => Promise<RemoteSyncResult>
  /** Storage target backing the adapter. */
  target: 'remote'
  /** Adapter type identifier. */
  type: string
}

/**
 * The built-in static vector store.
 *
 * @example
 * ```ts
 * import { defineConfig, Retriever, VectorStore } from 'vocs/config'
 *
 * export default defineConfig({
 *   ai: {
 *     retriever: Retriever.local({ vectorStore: VectorStore.static({ format: 'int8' }) }),
 *   },
 * })
 * ```
 */
// biome-ignore lint/correctness/noUnusedVariables: re-exported below as `static`
function staticStore(options: staticStore.Options = {}): StaticAdapter {
  return {
    type: 'static',
    target: 'static',
    format: options.format ?? 'auto',
    expose: options.expose ?? false,
    maxClientBytes: options.maxClientBytes,
  }
}

export declare namespace staticStore {
  type Options = {
    /** Emit a public/browser artifact even in server runtime. @default false */
    expose?: boolean | undefined
    /** Storage format. @default 'auto' */
    format?: 'auto' | Format | undefined
    /** Build warning threshold for the public artifact in bytes. */
    maxClientBytes?: number | undefined
  }
}

export { staticStore as static }

/**
 * Cloudflare Vectorize vector store (remote). Vocs still chunks and embeds
 * locally (with the configured `embedding` adapter); vectors are synced into a
 * Vectorize index at build time and queried over REST at runtime, so no vector
 * artifact ships with the server bundle.
 *
 * The index is created on first sync (cosine metric, dimensions inferred from
 * the embedding). Sync is incremental: vector ids are content-addressed, so
 * unchanged chunks are skipped and stale vectors are pruned. The API token
 * needs the `Vectorize:Edit` permission.
 *
 * @example
 * ```ts
 * import { defineConfig, Embedding, Retriever, VectorStore } from 'vocs/config'
 *
 * export default defineConfig({
 *   ai: {
 *     retriever: Retriever.local({
 *       embedding: Embedding.openai(),
 *       vectorStore: VectorStore.cloudflare({ index: 'my-docs' }),
 *     }),
 *   },
 * })
 * ```
 */
export function cloudflare(options: cloudflare.Options = {}): RemoteAdapter {
  const {
    accountId = process.env['CLOUDFLARE_ACCOUNT_ID'],
    apiToken = process.env['CLOUDFLARE_API_TOKEN'],
    baseUrl = 'https://api.cloudflare.com/client/v4',
    headers,
    index = 'vocs-ai-search',
  } = options

  async function request(
    path: string,
    init: {
      body?: string | undefined
      contentType?: string | undefined
      method?: string | undefined
      signal?: AbortSignal | undefined
    } = {},
  ): Promise<Response> {
    if (!accountId)
      throw new Error(
        '[vocs] VectorStore.cloudflare: missing `accountId` (or CLOUDFLARE_ACCOUNT_ID).',
      )
    if (!apiToken)
      throw new Error(
        '[vocs] VectorStore.cloudflare: missing `apiToken` (or CLOUDFLARE_API_TOKEN).',
      )
    const url = `${baseUrl.replace(/\/$/, '')}/accounts/${accountId}/vectorize/v2/indexes${path}`
    return await fetch(url, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        ...(init.contentType ? { 'Content-Type': init.contentType } : {}),
        ...headers,
      },
      ...(init.body !== undefined ? { body: init.body } : {}),
      signal: init.signal ?? null,
    })
  }

  /** Creates the index when missing; validates dimensions when present. */
  async function ensureIndex(dimensions: number): Promise<void> {
    const existing = await request(`/${index}`)
    if (existing.ok) {
      const json = (await existing.json()) as {
        result?: { config?: { dimensions?: number | undefined } | undefined } | undefined
      }
      const remote = json.result?.config?.dimensions
      if (remote !== undefined && remote !== dimensions)
        throw new Error(
          `[vocs] Vectorize index "${index}" has ${remote} dimensions, embedding produces ${dimensions}. Delete the index or configure a different \`index\` name.`,
        )
      return
    }
    if (existing.status !== 404)
      throw new Error(
        `[vocs] Vectorize get index failed (${existing.status}): ${await safeText(existing)}`,
      )
    const created = await request('', {
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ config: { dimensions, metric: 'cosine' }, name: index }),
    })
    if (!created.ok)
      throw new Error(
        `[vocs] Vectorize create index failed (${created.status}): ${await safeText(created)}`,
      )
  }

  /** Enumerates all vector ids in the index, or `undefined` when unsupported. */
  async function listIds(): Promise<Set<string> | undefined> {
    const ids = new Set<string>()
    let cursor: string | undefined
    do {
      const params = new URLSearchParams({ count: '1000' })
      if (cursor) params.set('cursor', cursor)
      const response = await request(`/${index}/list?${params}`)
      if (!response.ok) {
        console.warn(
          `[vocs] Vectorize list vectors failed (${response.status}); skipping incremental sync (re-upserting all, no pruning).`,
        )
        return undefined
      }
      const json = (await response.json()) as {
        result?:
          | {
              isTruncated?: boolean | undefined
              nextCursor?: string | undefined
              vectors?: { id?: string | undefined }[] | undefined
            }
          | undefined
      }
      for (const vector of json.result?.vectors ?? []) if (vector.id) ids.add(vector.id)
      cursor = json.result?.isTruncated ? json.result?.nextCursor : undefined
    } while (cursor)
    return ids
  }

  return {
    type: 'cloudflare',
    target: 'remote',
    async query(vector, { signal, topK }) {
      const response = await request(`/${index}/query`, {
        method: 'POST',
        contentType: 'application/json',
        body: JSON.stringify({
          vector: Array.from(vector),
          // Vectorize caps topK at 50 when returning metadata.
          topK: Math.min(topK, 50),
          returnValues: false,
          returnMetadata: 'all',
        }),
        signal,
      })
      if (!response.ok)
        throw new Error(
          `[vocs] Vectorize query failed (${response.status}): ${await safeText(response)}`,
        )
      const json = (await response.json()) as {
        result?:
          | {
              matches?:
                | { id?: string | undefined; metadata?: unknown; score?: number | undefined }[]
                | undefined
            }
          | undefined
      }
      return (json.result?.matches ?? []).map((match) => ({
        id: match.id ?? '',
        metadata:
          typeof match.metadata === 'object' && match.metadata !== null
            ? (match.metadata as Record<string, unknown>)
            : undefined,
        score: match.score ?? 0,
      }))
    },
    async sync(entries, { dimensions, onProgress }) {
      await ensureIndex(dimensions)

      // Content-addressed ids: unchanged chunks keep their id across builds,
      // so sync reduces to "upsert what's new, delete what's gone". Ids hash
      // the bounded metadata so truncation stays stable across builds.
      const local = new Map<string, RemoteEntry>()
      for (const entry of entries) {
        const bounded = { ...entry, metadata: boundMetadata(entry.metadata) }
        local.set(await contentId(bounded), bounded)
      }

      const remote = await listIds()
      const toUpsert = remote
        ? [...local.keys()].filter((id) => !remote.has(id))
        : [...local.keys()]
      const toDelete = remote ? [...remote].filter((id) => !local.has(id)) : []

      let upserted = 0
      const batchSize = 500
      for (let i = 0; i < toUpsert.length; i += batchSize) {
        const batch = toUpsert.slice(i, i + batchSize)
        const ndjson = batch
          .map((id) => {
            const entry = local.get(id)
            if (!entry) return undefined
            return JSON.stringify({
              id,
              metadata: entry.metadata,
              values: Array.from(entry.vector),
            })
          })
          .filter((line): line is string => line !== undefined)
          .join('\n')
        const response = await request(`/${index}/upsert`, {
          method: 'POST',
          contentType: 'application/x-ndjson',
          body: ndjson,
        })
        if (!response.ok)
          throw new Error(
            `[vocs] Vectorize upsert failed (${response.status}): ${await safeText(response)}`,
          )
        upserted += batch.length
        onProgress?.(upserted, toUpsert.length)
      }

      for (let i = 0; i < toDelete.length; i += 1000) {
        const batch = toDelete.slice(i, i + 1000)
        const response = await request(`/${index}/delete_by_ids`, {
          method: 'POST',
          contentType: 'application/json',
          body: JSON.stringify({ ids: batch }),
        })
        if (!response.ok)
          throw new Error(
            `[vocs] Vectorize delete failed (${response.status}): ${await safeText(response)}`,
          )
      }

      return {
        deleted: toDelete.length,
        skipped: local.size - toUpsert.length,
        upserted: toUpsert.length,
      }
    },
  }
}

export declare namespace cloudflare {
  type Options = {
    /** Cloudflare account id. @default process.env.CLOUDFLARE_ACCOUNT_ID */
    accountId?: string | undefined
    /** API token with the `Vectorize:Edit` permission. @default process.env.CLOUDFLARE_API_TOKEN */
    apiToken?: string | undefined
    /** API base URL. @default 'https://api.cloudflare.com/client/v4' */
    baseUrl?: string | undefined
    /** Extra request headers. */
    headers?: Record<string, string> | undefined
    /** Vectorize index name (created on first sync). @default 'vocs-ai-search' */
    index?: string | undefined
  }
}

/** Creates a vector-store adapter from a custom definition. */
export function from(adapter: Adapter): Adapter {
  return adapter
}

/** Vectorize caps metadata at 10KiB/vector; trims the unbounded `text` field to fit. */
function boundMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const limit = 9216
  let text = typeof metadata['text'] === 'string' ? metadata['text'] : undefined
  for (;;) {
    const out = text !== undefined ? { ...metadata, text } : metadata
    const size = new TextEncoder().encode(JSON.stringify(out)).length
    if (size <= limit || !text) return out
    text = text.slice(0, Math.max(0, text.length - (size - limit)))
  }
}

/**
 * Content-addressed vector id: SHA-256 over chunk id, metadata, and vector
 * bytes. 64 hex chars — exactly Vectorize's 64-byte id cap.
 */
async function contentId(entry: RemoteEntry): Promise<string> {
  const prefix = new TextEncoder().encode(`${entry.id}\0${JSON.stringify(entry.metadata)}\0`)
  const vector = new Uint8Array(
    entry.vector.buffer,
    entry.vector.byteOffset,
    entry.vector.byteLength,
  )
  const bytes = new Uint8Array(prefix.length + vector.length)
  bytes.set(prefix, 0)
  bytes.set(vector, prefix.length)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  let hex = ''
  for (const byte of digest) hex += byte.toString(16).padStart(2, '0')
  return hex
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 200)
  } catch {
    return ''
  }
}

/**
 * Serialized vector matrix. `data` is base64 of the packed typed array; for
 * `int8`, `scales` is base64 of one Float32 dequantization scale per vector.
 */
export type Packed = {
  /** Number of vectors. */
  count: number
  /** Base64 of the packed typed array. */
  data: string
  /** Vector dimensionality. */
  dimensions: number
  /** Storage format of the packed data. */
  format: Format
  /** Base64 of per-vector Float32 dequantization scales (`int8` only). */
  scales?: string | undefined
}

/** In-memory, search-ready form of a {@link Packed} matrix. */
export type Store = {
  /** Number of vectors. */
  count: number
  /** Vector dimensionality. */
  dimensions: number
  /** Storage format of the matrix. */
  format: Format
  /** Flat row-major matrix of all vectors. */
  matrix: Float32Array | Int8Array
  /** Per-vector dequantization scales (`int8` only), else `undefined`. */
  scales: Float32Array | undefined
}

/** L2-normalizes a vector into a `Float32Array` (zero vectors pass through). */
export function normalize(vector: ArrayLike<number>): Float32Array {
  const out = new Float32Array(vector.length)
  let sum = 0
  for (let i = 0; i < vector.length; i++) {
    const value = vector[i] ?? 0
    sum += value * value
  }
  const norm = Math.sqrt(sum)
  if (norm === 0) return out
  for (let i = 0; i < vector.length; i++) out[i] = (vector[i] ?? 0) / norm
  return out
}

/**
 * Packs already-normalized vectors into a {@link Packed} matrix.
 *
 * - `float32`: full precision, ~4 bytes/dim. Best for server search.
 * - `int8`: symmetric per-vector quantization, ~1 byte/dim + scales. ~4× smaller,
 *   best for browser/static delivery.
 */
export function pack(vectors: readonly Float32Array[], format: Format): Packed {
  const count = vectors.length
  const dimensions = vectors[0]?.length ?? 0
  for (const v of vectors)
    if (v.length !== dimensions)
      throw new Error(`[vocs] vector dimension mismatch: expected ${dimensions}, got ${v.length}`)

  if (format === 'float32') {
    const matrix = new Float32Array(count * dimensions)
    for (let i = 0; i < count; i++) {
      const v = vectors[i]
      if (v) matrix.set(v, i * dimensions)
    }
    return { format, count, dimensions, data: encodeBytes(matrix) }
  }

  const matrix = new Int8Array(count * dimensions)
  const scales = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const v = vectors[i]
    if (!v) continue
    let max = 0
    for (let d = 0; d < dimensions; d++) max = Math.max(max, Math.abs(v[d] ?? 0))
    const scale = max === 0 ? 1 : max / 127
    scales[i] = scale
    for (let d = 0; d < dimensions; d++)
      matrix[i * dimensions + d] = Math.max(-127, Math.min(127, Math.round((v[d] ?? 0) / scale)))
  }
  return { format, count, dimensions, data: encodeBytes(matrix), scales: encodeBytes(scales) }
}

/** Loads a {@link Packed} matrix into a search-ready {@link Store}. */
export function load(packed: Packed): Store {
  if (packed.format === 'float32')
    return {
      format: 'float32',
      count: packed.count,
      dimensions: packed.dimensions,
      matrix: decodeFloat32(packed.data),
      scales: undefined,
    }
  return {
    format: 'int8',
    count: packed.count,
    dimensions: packed.dimensions,
    matrix: decodeInt8(packed.data),
    scales: packed.scales ? decodeFloat32(packed.scales) : undefined,
  }
}

export type SearchResult = {
  /** Index of the matching vector within the store. */
  index: number
  /** Cosine similarity score in `[0, 1]` (higher is more relevant). */
  score: number
}

/**
 * Returns the `topK` nearest vectors to a normalized `query` by cosine
 * similarity (dot product over normalized vectors).
 */
export function search(store: Store, query: Float32Array, topK: number): SearchResult[] {
  const { count, dimensions, matrix, scales } = store
  const results: SearchResult[] = []
  for (let i = 0; i < count; i++) {
    const base = i * dimensions
    let dot = 0
    for (let d = 0; d < dimensions; d++) dot += (matrix[base + d] ?? 0) * (query[d] ?? 0)
    const score = scales ? dot * (scales[i] ?? 1) : dot
    results.push({ index: i, score })
  }
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, topK)
}

/** Resolves `'auto'` to a concrete format for the given runtime. */
export function resolveFormat(
  format: StaticAdapter['format'],
  runtime: 'server' | 'client',
): Format {
  if (format !== 'auto') return format
  return runtime === 'client' ? 'int8' : 'float32'
}

function encodeBytes(arr: Float32Array | Int8Array): string {
  const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64')
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] ?? 0)
  return btoa(binary)
}

function decodeBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64')
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function decodeFloat32(base64: string): Float32Array {
  const bytes = decodeBytes(base64)
  // Copy into an aligned buffer (decoded view may not be 4-byte aligned).
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Float32Array(copy.buffer)
}

function decodeInt8(base64: string): Int8Array {
  const bytes = decodeBytes(base64)
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Int8Array(copy.buffer)
}
