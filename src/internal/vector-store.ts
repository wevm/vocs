/**
 * Built-in static vector store for RAG search — the default, open-source
 * alternative to a hosted vector DB (Pinecone, etc).
 *
 * Vectors are packed into a single typed-array matrix and base64-encoded, so the
 * whole index is one compact artifact that works server-side (Node) and, with
 * `int8` quantization, in the browser. Cosine similarity reduces to a dot
 * product because all vectors are normalized before packing.
 */

export type Format = 'float32' | 'int8'

export type Adapter = {
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

/**
 * The built-in static vector store.
 *
 * @example
 * ```ts
 * import { VectorStore } from 'vocs/config'
 *
 * export default defineConfig({
 *   search: { rag: { vectorStore: VectorStore.static({ format: 'int8' }) } },
 * })
 * ```
 */
// biome-ignore lint/correctness/noUnusedVariables: re-exported below as `static`
function staticStore(options: staticStore.Options = {}): Adapter {
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

/** Creates a vector-store adapter from a custom definition. */
export function from(adapter: Adapter): Adapter {
  return adapter
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
export function resolveFormat(format: Adapter['format'], runtime: 'server' | 'client'): Format {
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
