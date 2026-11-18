/**
 * Markdown content negotiation for documentation routes: which requests receive a page's
 * Markdown instead of its HTML, and where that Markdown lives. Framework-agnostic and
 * Workers-safe (no Node APIs), so the Waku `.md` router, `Handler.openApi`, and any Hono app
 * share one implementation.
 */
import type { Context, Env, MiddlewareHandler } from 'hono'

/** AI crawlers and agents, which receive Markdown. */
export const aiUserAgents = [
  'AI2Bot',
  'anthropic-ai',
  'Bytespider',
  'CCBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'claude-web',
  'ClaudeBot',
  'cohere-ai',
  'Diffbot',
  'FacebookBot',
  'Google-Extended',
  'GoogleAgent-Mariner',
  'GPTBot',
  'meta-externalagent',
  'MistralAI-User',
  'OAI-SearchBot',
  'omgili',
  'Perplexity-User',
  'PerplexityBot',
  'Timpibot',
] as const

/** Link-preview bots, which always receive HTML for its meta tags. */
export const previewUserAgents = [
  'Discordbot',
  'Embedly',
  'Facebot',
  'facebookexternalhit',
  'Iframely',
  'LinkedInBot',
  'Pinterestbot',
  'Slackbot',
  'Slurp',
  'TelegramBot',
  'Twitterbot',
  'WhatsApp',
] as const

/** Search engine crawlers, which receive HTML unless the path ends in `.md`. */
export const searchUserAgents = [
  'Amazonbot',
  'Applebot',
  'Applebot-Extended',
  'Bingbot',
  'DuckAssistBot',
  'Googlebot',
  'YouBot',
] as const

/** Terminal HTTP clients, which receive Markdown unless they name `text/html`. */
export const terminalUserAgents = ['curl/', 'HTTPie/', 'httpie-go/', 'Wget/', 'xh/'] as const

/** The request headers that select between a page's HTML and its Markdown. */
export const vary = 'Accept, User-Agent'

/**
 * Returns whether a request receives Markdown, in this order:
 *
 * 1. Link-preview bots receive HTML.
 * 2. A path that ends in `.md` receives Markdown.
 * 3. Search engines receive HTML.
 * 4. An `Accept` header that names `text/markdown` decides by quality: Markdown when its quality
 *    is above zero and at least that of `text/html`.
 * 5. AI agents receive Markdown, and terminal clients receive it unless they name `text/html`.
 * 6. Every other request receives HTML.
 *
 * @example
 * ```ts
 * Negotiation.prefers({ pathname: '/guide', accept: 'text/markdown;q=0.3, text/html;q=0.9' }) // false
 * Negotiation.prefers({ pathname: '/guide', userAgent: 'curl/8.7.1' }) // true
 * ```
 */
export function prefers(options: prefers.Options): boolean {
  const { accept = '', pathname, userAgent = '' } = options

  const matches = (agents: readonly string[]) => agents.some((agent) => userAgent.includes(agent))

  if (matches(previewUserAgents)) return false
  if (pathname.endsWith('.md')) return true
  if (matches(searchUserAgents)) return false

  const ranges = accept.split(',').map((range) => {
    const [type = '', ...parameters] = range.trim().toLowerCase().split(';')
    const weight = parameters
      .map((parameter) => parameter.trim())
      .find((parameter) => /^q\s*=/.test(parameter))
      ?.split('=')[1]
      ?.trim()
    const quality = (() => {
      if (weight === undefined) return 1
      if (!/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(weight)) return 0
      return Number(weight)
    })()
    return { quality, type: type.trim() }
  })
  // A specific media range overrides a wildcard, even when its quality is zero.
  function quality(type: string) {
    for (const match of [type, 'text/*', '*/*']) {
      const matching = ranges.filter((range) => range.type === match)
      if (matching.length) return Math.max(...matching.map((range) => range.quality))
    }
    return 0
  }

  if (ranges.some((range) => range.type === 'text/markdown')) {
    const markdown = quality('text/markdown')
    return markdown > 0 && markdown >= quality('text/html')
  }
  if (matches(aiUserAgents)) return true
  if (matches(terminalUserAgents)) return !ranges.some((range) => range.type === 'text/html')
  return false
}

export declare namespace prefers {
  type Options = {
    /** The request's `Accept` header. */
    accept?: string | undefined
    /** The request's path. */
    pathname: string
    /** The request's `User-Agent` header. */
    userAgent?: string | undefined
  }
}

/**
 * Returns the path of a page's Markdown, such as `/blog.md` for `/blog/`. The home page's
 * Markdown is `/index.md`, since `/` with a Markdown preference returns the index (`llms.txt`).
 */
export function path(pathname: string): string {
  const page = pathname.replace(/\/+$/, '')
  return page === '' ? '/index.md' : `${page}.md`
}

/**
 * Returns the page of a path, such as `/blog` for `/blog.md` or `/blog/`, `/foo` for
 * `/foo/index.md`, and `/` for `/index.md`.
 */
export function page(pathname: string): string {
  const page = pathname.replace(/\.md$/, '').replace(/\/+$/, '')
  if (page === '' || page === '/index') return '/'
  return page.endsWith('/index') ? page.slice(0, -'/index'.length) : page
}

/**
 * Hono middleware that serves a page's Markdown to the requests that {@link prefers} it, and adds
 * `Vary: Accept, User-Agent` to the HTML it passes through.
 *
 * - Only `GET` and `HEAD` requests on paths without a file extension (or ending in `.md`) are
 *   negotiated; `exclude` skips more.
 * - An agent's request for `/` receives `index` (typically `llms.txt`); `/index.md` is the home
 *   page's own Markdown.
 * - A page's Markdown carries `Link: <page>; rel="canonical"`.
 * - An unknown `.md` path returns `404` in Markdown; an unknown page falls through to HTML.
 *
 * @example
 * ```ts
 * import { Hono } from 'hono'
 * import * as Negotiation from 'vocs/server/negotiation'
 *
 * const app = new Hono()
 * app.use(
 *   Negotiation.middleware({
 *     exclude: [/^\/api\//, '/assets/'],
 *     index: () => llmsTxt,
 *     resolve: (c, page) => pages.get(page),
 *   }),
 * )
 * ```
 */
export function middleware<env extends Env = Env>(
  options: middleware.Options<env>,
): MiddlewareHandler<env> {
  const { canonical, exclude = [], index, resolve } = options

  return async (c, next) => {
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') return next()

    const url = new URL(c.req.url)
    const { pathname } = url
    if (
      exclude.some((pattern) =>
        typeof pattern === 'string' ? pathname.startsWith(pattern) : pattern.test(pathname),
      )
    )
      return next()

    const explicit = pathname.endsWith('.md')
    // Static assets (`.json`, `.svg`, `.txt`, ...) have no Markdown.
    if (!explicit && pathname.split('/').at(-1)?.includes('.')) return next()

    const html = async () => {
      await next()
      c.header('Vary', vary, { append: true })
    }

    const markdown = prefers({
      accept: c.req.header('accept'),
      pathname,
      userAgent: c.req.header('user-agent'),
    })
    if (!markdown) return html()

    if (!explicit && pathname === '/' && index) {
      const result = await index(c)
      if (result instanceof Response) return result
      if (typeof result === 'string') return respond(result)
      return html()
    }

    const target = page(pathname)
    const result = await resolve(c, target)
    if (result instanceof Response) return result
    if (typeof result === 'string') {
      const href =
        canonical === false ? undefined : canonical ? canonical(c, target) : url.origin + target
      return respond(result, 200, href)
    }
    if (explicit) return respond('Not found\n', 404)
    return html()

    function respond(text: string, status: 200 | 404 = 200, href?: string | undefined) {
      const headers: Record<string, string> = {
        'Content-Type': 'text/markdown; charset=utf-8',
        Vary: vary,
      }
      if (href) headers['Link'] = `<${href}>; rel="canonical"`
      return c.body(text, status, headers)
    }
  }
}

export declare namespace middleware {
  /** Markdown text, a complete response (such as a redirect), or nothing when missing. */
  type Result = string | Response | null | undefined

  type Options<env extends Env = Env> = {
    /**
     * Returns the canonical URL of a page's Markdown, for its `Link: rel="canonical"` header, or
     * `undefined` to omit the header for that page. `false` omits it for every page.
     * @default The request origin followed by the page, such as `https://example.com/guide`.
     */
    canonical?: false | ((c: Context<env>, page: string) => string | undefined) | undefined
    /** Paths the middleware never negotiates: a string matches a path prefix. */
    exclude?: readonly (string | RegExp)[] | undefined
    /**
     * Returns the Markdown that an agent receives for `/`, such as `llms.txt`. Without it, `/`
     * receives the home page's Markdown.
     */
    index?: ((c: Context<env>) => Result | Promise<Result>) | undefined
    /** Returns a page's Markdown, such as `/guide` for `/guide/` or `/guide.md`. */
    resolve: (c: Context<env>, page: string) => Result | Promise<Result>
  }
}
