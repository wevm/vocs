/**
 * The Vocs request handler, `(Request) => Response`. It serves the agent settings to the page,
 * and runs the model gateway, which forwards the agent's requests to the configured provider after it checks
 * the model, the body size, and the reader's request rate. It runs anywhere `fetch` runs.
 * @module
 */
import type * as Config from '../Config.js'
import * as Corpus from '../internal/Corpus.js'

/** A mounted handler. */
export type Handler = {
  /** Serves one request. Workers pass `env` and `ctx`. Other hosts may omit them. */
  fetch(request: Request, env?: Record<string, unknown>, ctx?: unknown): Promise<Response>
}

/** The agent settings the page reads before it loads the corpus. */
export type Agent = {
  /** URL of the sources the agent mounts, a static asset of the host's build. */
  corpus: string
  description: string | undefined
  /** The model the agent requests. */
  model: string | undefined
  title: string
}

/** A rate limiter with the shape of a Workers rate-limiting binding. */
export type RateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

/**
 * Creates a handler for a config and its corpus.
 *
 * @example
 * ```ts
 * import { Handler } from 'vocs/server'
 * import config from 'virtual:vocs/config'
 *
 * const docs = Handler.from(config, { basePath: '/docs', rateLimit: 'MODEL_RATE_LIMIT' })
 * export default { fetch: docs.fetch }
 * ```
 *
 * @throws {Handler.UnbuiltConfigError} When the config was not imported from `virtual:vocs/config`.
 */
export function from(config: Config.Config, options: from.Options): Handler {
  const basePath = options.basePath.replace(/\/$/, '')
  const bodyBytes = options.bodyBytes ?? 2_000_000
  const models = new Set(config.provider.models)
  const corpus = Corpus.asset(config)
  if (!corpus) throw new UnbuiltConfigError()
  const agent = {
    corpus: corpus.url,
    description: config.description,
    model: config.provider.models[0],
    title: config.title,
  } satisfies Agent

  return {
    async fetch(request, env = {}) {
      const url = new URL(request.url)
      if (!url.pathname.startsWith(`${basePath}/`)) return text(404, 'Not found.')
      const route = url.pathname.slice(basePath.length)

      if (route === '/agent' && request.method === 'GET')
        return Response.json(agent, { headers: { 'cache-control': 'no-cache' } })

      if (route === '/model/responses' && request.method === 'POST') {
        const body = await read(request, bodyBytes)
        if (body === undefined) return text(413, `The request is larger than ${bodyBytes} bytes.`)

        const model = (() => {
          try {
            return (JSON.parse(body) as { model?: unknown }).model
          } catch {
            return undefined
          }
        })()
        if (typeof model !== 'string' || !models.has(model))
          return text(
            400,
            `Model "${String(model)}" is not served. Use one of: ${[...models].join(', ')}.`,
          )

        if (options.rateLimit) {
          const limiter = env[options.rateLimit] as RateLimiter | undefined
          if (!limiter || typeof limiter.limit !== 'function')
            return text(
              500,
              `The rate-limit binding "${options.rateLimit}" is missing. Add it to the Worker.`,
            )
          const key =
            request.headers.get('cf-connecting-ip') ??
            request.headers.get('x-forwarded-for') ??
            'unknown'
          const result = await limiter.limit({ key })
          if (!result.success) return text(429, 'Too many requests. Wait a minute and ask again.')
        }

        try {
          const response = await config.provider.complete(body, { env, signal: request.signal })
          return new Response(response.body, {
            headers: {
              'cache-control': 'no-cache',
              'content-type': response.headers.get('content-type') ?? 'text/event-stream',
            },
            status: response.status,
          })
        } catch (error) {
          return text(502, error instanceof Error ? error.message : 'The provider failed.')
        }
      }

      return text(404, 'Not found.')
    },
  }
}

export declare namespace from {
  type Options = {
    /** Path prefix of every route, such as `/docs`. */
    basePath: string
    /** Largest model request body in bytes. Defaults to 2,000,000. */
    bodyBytes?: number | undefined
    /** Name of a rate-limiting binding in `env`. Model requests are limited per address when set. */
    rateLimit?: string | undefined
  }
}

/** Thrown when a config reaches the handler without the sources the `vocs()` plugin builds. */
export class UnbuiltConfigError extends Error {
  override name = 'Handler.UnbuiltConfigError'
  constructor() {
    super(
      'The config has no built sources. Add the `vocs()` plugin from `vocs/vite` and import the config from `virtual:vocs/config`.',
    )
  }
}

/**
 * Reads a request body of at most `limit` bytes. A larger body is drained without buffering and
 * returns `undefined`: answering before the upload ends makes some clients and proxies fail the
 * request instead of reading the response.
 */
async function read(request: Request, limit: number): Promise<string | undefined> {
  if (!request.body) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of request.body) {
    size += chunk.byteLength
    if (size <= limit) chunks.push(chunk)
  }
  if (size > limit) return undefined
  return new TextDecoder().decode(await new Blob(chunks as BlobPart[]).arrayBuffer())
}

function text(status: number, message: string) {
  return new Response(message, { headers: { 'content-type': 'text/plain' }, status })
}
