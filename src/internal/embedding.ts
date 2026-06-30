/**
 * Embedding adapters for RAG search.
 *
 * Adapters turn text into vectors. They follow the same shape as
 * {@link Feedback.Adapter} and {@link McpSource.Adapter}: a plain object with a
 * `type` discriminator and async methods. Built-ins use `fetch` (no vendor SDK)
 * so they run in any modern runtime.
 *
 * Adapters hold secrets (API keys) and therefore must only ever live in the
 * private `_rag` config — never in serializable config sent to the browser.
 */

/** A single embedding vector. */
export type Vector = readonly number[]

export type EmbedContext = {
  /**
   * Whether the text being embedded is a stored document or a live query.
   * Some models require different prefixes for each (e.g. e5/bge).
   */
  purpose: 'document' | 'query'
  /** Optional abort signal to cancel the request. */
  signal?: AbortSignal | undefined
}

export type Adapter = {
  /** Output dimensionality, when known ahead of time. */
  dimensions?: number | undefined
  /** Embed a batch of strings into vectors (order-preserving). */
  embed: (input: readonly string[], context: EmbedContext) => Promise<readonly Vector[]>
  /** Maximum inputs per request. The build pipeline batches by this value. */
  maxBatchSize?: number | undefined
  /** Model identifier used for embeddings. */
  model: string
  /** Adapter type identifier (e.g. `'openai'`, `'ollama'`). */
  type: string
}

/**
 * Creates an embedding adapter from a custom definition.
 *
 * @example
 * ```ts
 * import { Embedding } from 'vocs/config'
 *
 * const embedding = Embedding.from({
 *   type: 'custom',
 *   model: 'my-model',
 *   async embed(input) { ... },
 * })
 * ```
 */
export function from(adapter: Adapter): Adapter {
  return adapter
}

/**
 * OpenAI embeddings adapter (uses the `/embeddings` REST endpoint via `fetch`).
 *
 * Defaults to `process.env.OPENAI_API_KEY` and `text-embedding-3-small`.
 *
 * @example
 * ```ts
 * import { Embedding } from 'vocs/config'
 *
 * export default defineConfig({
 *   search: { rag: { embedding: Embedding.openai() } },
 * })
 * ```
 */
export function openai(options: openai.Options = {}): Adapter {
  const {
    apiKey = process.env['OPENAI_API_KEY'],
    baseUrl = 'https://api.openai.com/v1',
    dimensions,
    headers,
    maxBatchSize = 256,
    model = 'text-embedding-3-small',
  } = options
  return {
    type: 'openai',
    model,
    dimensions,
    maxBatchSize,
    async embed(input, context) {
      if (input.length === 0) return []
      const body: Record<string, unknown> = { input, model }
      if (dimensions) body['dimensions'] = dimensions
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          ...headers,
        },
        body: JSON.stringify(body),
        signal: context.signal ?? null,
      })
      if (!response.ok)
        throw new Error(
          `[vocs] embedding request failed (${response.status}): ${await safeText(response)}`,
        )
      const json = (await response.json()) as { data: { embedding: number[]; index: number }[] }
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
    },
  }
}

export declare namespace openai {
  type Options = {
    /** API key. @default process.env.OPENAI_API_KEY */
    apiKey?: string | undefined
    /** Base URL. @default 'https://api.openai.com/v1' */
    baseUrl?: string | undefined
    /** Requested output dimensions (for models that support truncation). */
    dimensions?: number | undefined
    /** Extra request headers. */
    headers?: Record<string, string> | undefined
    /** Max inputs per request. @default 256 */
    maxBatchSize?: number | undefined
    /** Model id. @default 'text-embedding-3-small' */
    model?: string | undefined
  }
}

/**
 * Any OpenAI-compatible embeddings endpoint (LM Studio, vLLM, OpenRouter,
 * Ollama's `/v1` shim, etc). Same wire format as {@link openai}, custom base URL.
 *
 * @example
 * ```ts
 * Embedding.openaiCompatible({
 *   baseUrl: 'http://localhost:11434/v1',
 *   model: 'nomic-embed-text',
 * })
 * ```
 */
export function openaiCompatible(options: openaiCompatible.Options): Adapter {
  return { ...openai(options), type: 'openai-compatible' }
}

export declare namespace openaiCompatible {
  type Options = openai.Options & {
    /** Base URL of the OpenAI-compatible server (required). */
    baseUrl: string
  }
}

/**
 * OpenRouter embeddings adapter — a single key for embedding models from many
 * providers (OpenAI, Cohere, Mistral, …) via OpenRouter's OpenAI-compatible
 * `/embeddings` endpoint. Model ids are org-prefixed slugs.
 *
 * @example
 * ```ts
 * Embedding.openrouter({ model: 'openai/text-embedding-3-small' })
 * ```
 */
export function openrouter(options: openrouter.Options = {}): Adapter {
  const {
    apiKey = process.env['OPENROUTER_API_KEY'],
    baseUrl = 'https://openrouter.ai/api/v1',
    model = 'openai/text-embedding-3-small',
    referer,
    title,
    headers,
    ...rest
  } = options
  return {
    ...openai({
      ...rest,
      apiKey,
      baseUrl,
      model,
      headers: {
        ...(referer ? { 'HTTP-Referer': referer } : {}),
        ...(title ? { 'X-Title': title } : {}),
        ...headers,
      },
    }),
    type: 'openrouter',
  }
}

export declare namespace openrouter {
  type Options = openai.Options & {
    /** Leaderboard attribution — your site URL (sent as `HTTP-Referer`). */
    referer?: string | undefined
    /** Leaderboard attribution — your app title (sent as `X-Title`). */
    title?: string | undefined
  }
}

/**
 * Native Ollama embeddings adapter (uses `/api/embed`). Dependency-free and the
 * best zero-key open-source default — no paid API and no browser model download.
 *
 * @example
 * ```ts
 * Embedding.ollama({ model: 'nomic-embed-text' })
 * ```
 */
export function ollama(options: ollama.Options = {}): Adapter {
  const {
    baseUrl = process.env['OLLAMA_HOST'] ?? 'http://localhost:11434',
    maxBatchSize = 64,
    model = 'nomic-embed-text',
    prefix,
  } = options
  return {
    type: 'ollama',
    model,
    maxBatchSize,
    async embed(input, context) {
      if (input.length === 0) return []
      const p = prefix?.[context.purpose] ?? ''
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: p ? input.map((t) => p + t) : input }),
        signal: context.signal ?? null,
      })
      if (!response.ok)
        throw new Error(
          `[vocs] ollama embedding failed (${response.status}): ${await safeText(response)}`,
        )
      const json = (await response.json()) as { embeddings: number[][] }
      return json.embeddings
    },
  }
}

export declare namespace ollama {
  type Options = {
    /** Base URL. @default process.env.OLLAMA_HOST ?? 'http://localhost:11434' */
    baseUrl?: string | undefined
    /** Max inputs per request. @default 64 */
    maxBatchSize?: number | undefined
    /** Model id. @default 'nomic-embed-text' */
    model?: string | undefined
    /** Optional per-purpose text prefixes (for models like e5/bge). */
    prefix?:
      | {
          /** Prefix prepended to document text. */
          document?: string | undefined
          /** Prefix prepended to query text. */
          query?: string | undefined
        }
      | undefined
  }
}

/**
 * Deterministic, dependency-free embedder for tests and offline builds. Hashes
 * tokens into a fixed-size bag-of-words vector. Not semantically meaningful, but
 * stable: the same text always yields the same vector.
 */
export function mock(options: mock.Options = {}): Adapter {
  const { dimensions = 64, model = 'mock' } = options
  return {
    type: 'mock',
    model,
    dimensions,
    maxBatchSize: 512,
    async embed(input) {
      return input.map((text) => {
        const vector = new Array<number>(dimensions).fill(0)
        for (const token of text.toLowerCase().split(/[^a-z0-9]+/)) {
          if (!token) continue
          let hash = 2166136261
          for (let i = 0; i < token.length; i++) {
            hash ^= token.charCodeAt(i)
            hash = Math.imul(hash, 16777619)
          }
          const index = Math.abs(hash) % dimensions
          vector[index] = (vector[index] ?? 0) + 1
        }
        return vector
      })
    },
  }
}

export declare namespace mock {
  type Options = {
    /** Output dimensionality. @default 64 */
    dimensions?: number | undefined
    /** Model id reported by the adapter. @default 'mock' */
    model?: string | undefined
  }
}

/**
 * Transformers.js embedder (runs an ONNX model locally in Node or the browser).
 *
 * @remarks Not yet implemented — placeholder for the client-only static mode
 * (roadmap Phase 6). Requires adding `@huggingface/transformers` as an optional
 * dependency.
 */
export function transformers(_options: transformers.Options): Adapter {
  throw new Error(
    '[vocs] Embedding.transformers() is not implemented yet. Use Embedding.openai(), Embedding.openaiCompatible(), or Embedding.ollama().',
  )
}

export declare namespace transformers {
  type Options = {
    /** Hugging Face model id to load. */
    model: string
    /** Execution target for the ONNX runtime. @default 'node' */
    target?: 'node' | 'browser' | undefined
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500)
  } catch {
    return '<no body>'
  }
}
