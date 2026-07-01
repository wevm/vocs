/**
 * Reranker adapters for RAG search.
 *
 * A reranker is a cross-encoder "search model": given a query and a set of
 * candidate passages, it scores each `(query, passage)` pair *jointly* (unlike
 * an embedding model, which encodes each independently) and returns a relevance
 * ordering. It runs after vector retrieval to boost precision on the top-K
 * candidates.
 *
 * Adapters follow the same shape as {@link Embedding.Adapter}: a plain object
 * with a `type` discriminator and async methods. Built-ins use `fetch` (no
 * vendor SDK) so they run in any modern runtime.
 *
 * Adapters hold secrets (API keys) and therefore must only ever live in the
 * private `_rag` config — never in serializable config sent to the browser.
 */

export type RerankContext = {
  /** Optional abort signal to cancel the request. */
  signal?: AbortSignal | undefined
  /** Number of top results to return. Adapters may return fewer. */
  topK?: number | undefined
}

/** A single reranked candidate, referring back to the input by index. */
export type RerankResult = {
  /** Index of the document in the input array. */
  index: number
  /** Relevance score in `[0, 1]` (higher is more relevant). */
  score: number
}

export type Adapter = {
  /** Maximum documents per request. The caller batches by this value. */
  maxBatchSize?: number | undefined
  /** Model identifier used for reranking. */
  model: string
  /**
   * Rerank `documents` by relevance to `query`. Returns results referring back
   * to the input by `index`, ordered best-first. May return fewer than the
   * input length (e.g. when `context.topK` is set).
   */
  rerank: (
    query: string,
    documents: readonly string[],
    context: RerankContext,
  ) => Promise<readonly RerankResult[]>
  /** Adapter type identifier (e.g. `'cloudflare'`). */
  type: string
}

/**
 * Creates a reranker adapter from a custom definition.
 *
 * @example
 * ```ts
 * import { Reranker } from 'vocs/config'
 *
 * const reranker = Reranker.from({
 *   type: 'custom',
 *   model: 'my-reranker',
 *   async rerank(query, documents) { ... },
 * })
 * ```
 */
export function from(adapter: Adapter): Adapter {
  return adapter
}

/**
 * Cloudflare Workers AI reranker adapter (uses the `/ai/run/{model}` REST
 * endpoint via `fetch`). Runs a cross-encoder on Cloudflare's edge — a fully
 * managed, pay-per-use alternative to self-hosting a reranker.
 *
 * Defaults to `@cf/baai/bge-reranker-base` and reads credentials from
 * `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN`.
 *
 * @example
 * ```ts
 * import { Embedding, Reranker } from 'vocs/config'
 *
 * export default defineConfig({
 *   search: {
 *     rag: {
 *       embedding: Embedding.cloudflare(),
 *       reranker: Reranker.cloudflare(),
 *     },
 *   },
 * })
 * ```
 */
export function cloudflare(options: cloudflare.Options = {}): Adapter {
  const {
    accountId = process.env['CLOUDFLARE_ACCOUNT_ID'],
    apiToken = process.env['CLOUDFLARE_API_TOKEN'],
    baseUrl = 'https://api.cloudflare.com/client/v4',
    headers,
    maxBatchSize = 100,
    model = '@cf/baai/bge-reranker-base',
  } = options
  return {
    type: 'cloudflare',
    model,
    maxBatchSize,
    async rerank(query, documents, context) {
      if (documents.length === 0) return []
      if (!accountId)
        throw new Error(
          '[vocs] Reranker.cloudflare: missing `accountId` (or CLOUDFLARE_ACCOUNT_ID).',
        )
      if (!apiToken)
        throw new Error('[vocs] Reranker.cloudflare: missing `apiToken` (or CLOUDFLARE_API_TOKEN).')
      const url = `${baseUrl.replace(/\/$/, '')}/accounts/${accountId}/ai/run/${model}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          query,
          contexts: documents.map((text) => ({ text })),
          ...(context.topK ? { top_k: context.topK } : {}),
        }),
        signal: context.signal ?? null,
      })
      if (!response.ok)
        throw new Error(
          `[vocs] cloudflare rerank failed (${response.status}): ${await safeText(response)}`,
        )
      const json = (await response.json()) as {
        result?: { response?: { id: number; score: number }[] }
      }
      const data = json.result?.response
      if (!data) throw new Error('[vocs] cloudflare rerank response missing `result.response`.')
      // Cloudflare already maps reranker relevance to `[0, 1]`, so pass scores
      // through as-is (they combine cleanly with per-source weights).
      return data.map((r) => ({ index: r.id, score: r.score }))
    },
  }
}

export declare namespace cloudflare {
  type Options = {
    /** Cloudflare account id. @default process.env.CLOUDFLARE_ACCOUNT_ID */
    accountId?: string | undefined
    /** API token with the `Workers AI` permission. @default process.env.CLOUDFLARE_API_TOKEN */
    apiToken?: string | undefined
    /** API base URL. @default 'https://api.cloudflare.com/client/v4' */
    baseUrl?: string | undefined
    /** Extra request headers. */
    headers?: Record<string, string> | undefined
    /** Max inputs per request (Workers AI allows up to 100). @default 100 */
    maxBatchSize?: number | undefined
    /** Model id. @default '@cf/baai/bge-reranker-base' */
    model?: string | undefined
  }
}

/**
 * Deterministic in-memory reranker for tests. Scores each document by simple
 * query-token overlap so retrieval order is predictable without a network call.
 */
export function mock(options: mock.Options = {}): Adapter {
  const { model = 'mock' } = options
  return {
    type: 'mock',
    model,
    maxBatchSize: 512,
    async rerank(query, documents, context) {
      const terms = new Set(
        query
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean),
      )
      const scored = documents.map((text, index) => {
        const tokens = text
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
        const score = tokens.filter((t) => terms.has(t)).length
        return { index, score }
      })
      scored.sort((a, b) => b.score - a.score)
      return context.topK ? scored.slice(0, context.topK) : scored
    },
  }
}

export declare namespace mock {
  type Options = {
    /** Model identifier reported by the adapter. @default 'mock' */
    model?: string | undefined
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500)
  } catch {
    return '<no body>'
  }
}
