/**
 * The Vocs request handler, `(Request) => Response`. It serves the agent settings to the page,
 * runs the model gateway, which forwards the agent's requests to the configured provider after it checks
 * the model, the body size, and the reader's request rate, renders code blocks to highlighted HTML,
 * and saves pages to storage and serves their server-rendered permalinks. It runs anywhere `fetch` runs.
 * @module
 */
import type * as Block from '../Block.js'
import type * as Config from '../Config.js'
import * as Corpus from '../internal/Corpus.js'
import * as Highlight from '../internal/Highlight.js'
import * as Saved from '../internal/Saved.js'

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
  /** Path that saves pages and serves their permalinks, or `undefined` when the site has no storage. */
  pages: string | undefined
  title: string
  /** Packages that Twoslash code blocks may import, or `undefined` when Twoslash is off. */
  twoslash: readonly string[] | undefined
}

/**
 * The result of `POST <basePath>/render`: the highlighted HTML inside `<code>`, or the reason the
 * snippet does not render, such as a Twoslash type error, for the agent to fix.
 */
export type Render = { error: string; html?: undefined } | { error?: undefined; html: string }

/** The result of `POST <basePath>/pages`. */
export type Save = {
  /** Permalink ID, such as `attach-a-memo-k3f9a2`. */
  id: string
  /** Permalink path, such as `/docs/pages/attach-a-memo-k3f9a2`. */
  url: string
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
    pages: config.storage ? `${basePath}/pages` : undefined,
    title: config.title,
    twoslash: config.twoslash?.packages,
  } satisfies Agent
  const highlighter = Highlight.create({ types: Highlight.types(config) })
  // Rendered HTML by snippet, so a repeated block, such as one on a saved page, renders once.
  const rendered = new Map<string, string>()
  const key = (snippet: Highlight.Snippet) =>
    JSON.stringify([snippet.code, snippet.lang, snippet.twoslash === true])

  async function render(snippet: Highlight.Snippet): Promise<Render> {
    const cached = rendered.get(key(snippet))
    if (cached !== undefined) return { html: cached }
    try {
      const html = await highlighter.render(snippet)
      if (rendered.size >= renderCache) rendered.delete(rendered.keys().next().value!)
      rendered.set(key(snippet), html)
      return { html }
    } catch (error) {
      if (error instanceof Highlight.TypeCheckError || error instanceof Highlight.UnsupportedError)
        return { error: error.message }
      throw error
    }
  }

  /** Renders the code of a block again, so stored HTML never comes from the reader's page. */
  async function highlight(block: Block.Block): Promise<Block.Rendered> {
    if (block.type === 'code') return { ...block, html: (await render(block)).html }
    if (block.type === 'codeGroup')
      return {
        ...block,
        tabs: await Promise.all(
          block.tabs.map(async (tab) => ({ ...tab, html: (await render(tab)).html })),
        ),
      }
    return block
  }

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

        const next = { code: snippet.code, lang: snippet.lang, twoslash: snippet.twoslash }
        // Twoslash runs the TypeScript checker, so only its uncached renders count against the limit.
        if (next.twoslash && !rendered.has(key(next))) {
          const limited = await limit(request, env, 'render')
          if (limited) return limited
        }

        return Response.json(await render(next))
      }

      if (route === '/pages' && request.method === 'POST') {
        const storage = config.storage
        if (!storage) return text(404, 'This site has no storage. Set `storage` in the config.')
        const limited = await limit(request, env, 'save')
        if (limited) return limited

        const body = await read(request, saveBytes)
        if (body === undefined) return text(413, `The request is larger than ${saveBytes} bytes.`)
        const draft = (() => {
          try {
            return Saved.parse(JSON.parse(body))
          } catch (error) {
            return error instanceof Error ? error : new Error(String(error))
          }
        })()
        if (draft instanceof Error) return text(400, draft.message)

        const pages = await Promise.all(
          draft.pages.map(async (page) => ({
            ...page,
            blocks: await Promise.all(page.blocks.map(highlight)),
          })),
        )
        const id = `${draft.pages[0]!.slug.slice(0, 60).replace(/-$/, '')}-${suffix()}`
        await storage.put(
          `pages/${id}`,
          JSON.stringify({ files: draft.files, id, pages } satisfies Saved.Saved),
          { env },
        )
        return Response.json({ id, url: `${basePath}/pages/${id}` } satisfies Save, {
          status: 201,
        })
      }

      const permalink = route.match(/^\/pages\/([^/]+)(?:\/([^/]+))?$/)
      if (permalink && request.method === 'GET') {
        const [, id = '', slug] = permalink
        const storage = config.storage
        if (!storage) return text(404, 'This site has no storage. Set `storage` in the config.')
        const value = Saved.segment.test(id) ? await storage.get(`pages/${id}`, { env }) : undefined
        if (value === undefined) return text(404, `Page "${id}" does not exist.`)
        const saved = JSON.parse(value) as Saved.Saved
        const page =
          slug === undefined ? saved.pages[0] : saved.pages.find((entry) => entry.slug === slug)
        if (!page) return text(404, `Page "${id}" has no page "${slug}".`)

        // React and the block components load on the first permalink.
        const Permalink = await import('../internal/Permalink.js')
        const stream = await Permalink.render({
          basePath,
          page,
          saved,
          site: { description: config.description, title: config.title },
        })
        return new Response(stream, {
          headers: {
            'cache-control': 'public, max-age=300',
            'content-type': 'text/html; charset=utf-8',
          },
        })
      }

      return text(404, 'Not found.')
    },
  }
}

/** Largest render request body in bytes. */
const renderBytes = 64_000

/** Number of rendered snippets the handler keeps. */
const renderCache = 100

/** Largest save request body in bytes. */
const saveBytes = 1_000_000

/** Returns six random base-36 characters, which keep permalink IDs unguessable and short. */
function suffix(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) =>
    (byte % 36).toString(36),
  ).join('')
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
