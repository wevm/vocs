/**
 * The Vocs request handler, `(Request) => Response`. It serves the agent settings to the page,
 * runs the model gateway, which forwards the agent's requests to the configured provider after it checks
 * the model, the body size, and the reader's request rate, and renders code blocks to highlighted HTML.
 * It runs anywhere `fetch` runs.
 * @module
 */
import type * as Config from '../Config.js'
import * as Corpus from '../internal/Corpus.js'
import * as Highlight from '../internal/Highlight.js'

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
  /** Packages that Twoslash code blocks may import, or `undefined` when Twoslash is off. */
  twoslash: readonly string[] | undefined
}

/**
 * The result of `POST <basePath>/render`: the highlighted HTML inside `<code>`, or the reason the
 * snippet does not render, such as a Twoslash type error, for the agent to fix.
 */
export type Render = { error: string; html?: undefined } | { error?: undefined; html: string }

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
    twoslash: config.twoslash?.packages,
  } satisfies Agent
  const highlighter = Highlight.create({ types: Highlight.types(config) })
  // Rendered HTML by snippet, so a repeated block, such as one on a revised page, renders once.
  const rendered = new Map<string, string>()

  async function limit(request: Request, env: Record<string, unknown>, scope: string) {
    if (!options.rateLimit) return undefined
    const limiter = env[options.rateLimit] as RateLimiter | undefined
    if (!limiter || typeof limiter.limit !== 'function')
      return text(
        500,
        `The rate-limit binding "${options.rateLimit}" is missing. Add it to the Worker.`,
      )
    const address =
      request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown'
    const result = await limiter.limit({ key: `${scope}:${address}` })
    if (!result.success) return text(429, 'Too many requests. Wait a minute and try again.')
    return undefined
  }

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

        const limited = await limit(request, env, 'model')
        if (limited) return limited

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

      if (route === '/render' && request.method === 'POST') {
        const body = await read(request, renderBytes)
        if (body === undefined) return text(413, `The request is larger than ${renderBytes} bytes.`)
        const snippet = (() => {
          try {
            return JSON.parse(body) as Partial<Record<keyof Highlight.Snippet, unknown>>
          } catch {
            return undefined
          }
        })()
        if (
          typeof snippet?.code !== 'string' ||
          typeof snippet.lang !== 'string' ||
          (snippet.twoslash !== undefined && typeof snippet.twoslash !== 'boolean')
        )
          return text(
            400,
            'The body must be JSON with `code` and `lang` strings, and an optional `twoslash` boolean.',
          )

        const key = JSON.stringify([snippet.code, snippet.lang, snippet.twoslash === true])
        const cached = rendered.get(key)
        if (cached !== undefined) return Response.json({ html: cached } satisfies Render)

        // Twoslash runs the TypeScript checker, so only its renders count against the limit.
        if (snippet.twoslash) {
          const limited = await limit(request, env, 'render')
          if (limited) return limited
        }

        try {
          const result = await highlighter.render({
            code: snippet.code,
            lang: snippet.lang,
            twoslash: snippet.twoslash,
          })
          if (rendered.size >= renderCache) rendered.delete(rendered.keys().next().value!)
          rendered.set(key, result)
          return Response.json({ html: result } satisfies Render)
        } catch (error) {
          if (
            error instanceof Highlight.TypeCheckError ||
            error instanceof Highlight.UnsupportedError
          )
            return Response.json({ error: error.message } satisfies Render)
          throw error
        }
      }

      return text(404, 'Not found.')
    },
  }
}

/** Largest render request body in bytes. */
const renderBytes = 64_000

/** Number of rendered snippets the handler keeps. */
const renderCache = 100

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
