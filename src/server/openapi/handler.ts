import { getRequestListener } from '@hono/node-server'
import { Hono } from 'hono'
import type { Payload } from '../../internal/openapi/app.js'
import { inferMount, knownRoutes } from '../../internal/openapi/app.js'
import type * as OpenApi from '../../internal/openapi/openapi.js'
import * as Assets from './assets.js'
import * as Html from './html.js'
import * as State from './state.js'

/**
 * A standalone OpenAPI reference handler: a Hono app augmented with a Node
 * request `listener` so it can be mounted onto a Hono server (`app.route(...)`),
 * served via the Web-standard `fetch`, or run with `node:http`.
 */
export type Handler<app extends Hono = Hono> = app & {
  /** Node.js `(req, res)` request listener (for `http.createServer`). */
  listener: ReturnType<typeof getRequestListener>
}

/**
 * Creates a standalone, mountable OpenAPI reference (Scalar-style, rendered
 * entirely client-side by a prebuilt browser bundle shipped inside Vocs).
 *
 * Accepts the same config as a `vocs.config.ts` `openapi[]` entry, except `path`
 * is optional (the mount location is provided by the host server; `path` only
 * seeds generated link bases). Supply `pages` to add `.md`/`.mdx` override/guide
 * content to the sidebar.
 *
 * @example
 * ```ts
 * import { Hono } from 'hono'
 * import { Handler } from 'vocs/server'
 *
 * const app = new Hono()
 * app.route('/docs', Handler.openApi({ spec: 'https://example.com/openapi.json' }))
 * export default app
 * ```
 *
 * @example
 * ```ts
 * // Node.js
 * import * as http from 'node:http'
 * import { Handler } from 'vocs/server'
 *
 * const ref = Handler.openApi({ spec: './openapi.yaml' })
 * http.createServer(ref.listener).listen(3000)
 * ```
 */
export function openApi(config: OpenApi.Config, options: openApi.Options = {}): Handler {
  const app = new Hono()

  // Parse the spec + compile pages once, lazily, and memoize.
  let state: Promise<Payload> | undefined
  const prepare = () => {
    if (!state) state = State.prepare(config, { rootDir: options.rootDir })
    return state
  }

  app.get('*', async (c, next) => {
    const { pathname } = new URL(c.req.url)

    // Serve a bundled asset if the path targets the asset root.
    const asset = Assets.match(pathname)
    if (asset) return Assets.response(asset)

    const payload = await prepare()
    const routes = knownRoutes(payload)

    // Fallthrough mode: only own the reference's own routes (the intro/landing,
    // each group/page, and the asset root above) and defer everything else to
    // the host app via `next()`. This lets the handler be mounted at the host
    // root (`app.route('/', handler)`) alongside a JSON API and a JSON
    // `notFound` without its catch-all swallowing them. The mount prefix comes
    // from Hono's matched `routePath` (e.g. `/api/*`), so it's exact — unlike
    // suffix inference, an API path like `/api/v1/blocks` is never mistaken for
    // a docs route.
    if (options.fallback === 'next') {
      const mount = mountFromRoutePath(c.req.routePath)
      const relative = (pathname.startsWith(mount) ? pathname.slice(mount.length) : pathname) || '/'
      if (!isKnownRoute(relative, routes)) return next()
    }

    // Otherwise render the HTML shell (client-side router takes over).
    const manifest = Assets.manifest()
    if (!manifest.built)
      return c.text(
        '[vocs] The standalone OpenAPI bundle has not been built. Run `pnpm build` (or install a published build of `vocs`).',
        500,
      )
    // Infer the host mount prefix so asset URLs route back to this handler
    // regardless of where it is mounted (and independent of a trailing slash).
    const mount =
      options.fallback === 'next'
        ? mountFromRoutePath(c.req.routePath)
        : inferMount(pathname, routes)
    // The shell references content-hashed assets, so it must never be cached:
    // a stale shell would point at an old hash (404 after a rebuild), leaving
    // the page rendered but unstyled. Assets themselves stay `immutable`.
    return c.html(Html.render(payload, manifest, mount), 200, {
      'cache-control': 'no-store, must-revalidate',
    })
  })

  return withListener(app)
}

export declare namespace openApi {
  type Options = {
    /**
     * Directory file-path specs/pages are resolved against.
     * @default process.cwd()
     */
    rootDir?: string | undefined
    /**
     * How to handle requests that don't target one of the reference's own
     * routes (the intro/landing, a group/page, or the asset root).
     *
     * - `'render'` (default): render the HTML shell for any path, so client-side
     *   deep links work when the handler owns the whole mount (standalone docs).
     * - `'next'`: call Hono's `next()` so the host app handles the request. Use
     *   this when mounting at the host root next to other routes (e.g. a JSON
     *   API + JSON `notFound`):
     *
     * @example
     * ```ts
     * app.route('/', Handler.openApi({ spec }, { fallback: 'next' }))
     * ```
     *
     * @default 'render'
     */
    fallback?: 'render' | 'next' | undefined
  }
}

/** Derives the host mount prefix from Hono's matched `routePath` (`/api/*` → `/api`, `/*` → ``). */
function mountFromRoutePath(routePath: string | undefined): string {
  return (routePath ?? '').replace(/\*+$/, '').replace(/\/+$/, '')
}

/** Whether a mount-relative path is one of the reference's known section routes. */
function isKnownRoute(relativePath: string, routes: readonly string[]): boolean {
  const path = stripTrailingSlash(relativePath) || '/'
  return routes.some((route) => (stripTrailingSlash(route) || '/') === path)
}

function stripTrailingSlash(value: string): string {
  return value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value
}

/**
 * Composes multiple handlers onto a single Hono app mounted at `path`
 * (default `/`).
 */
export function compose(handlers: readonly Handler[], options: compose.Options = {}): Handler {
  const app = new Hono()
  for (const handler of handlers) app.route(options.path ?? '/', handler)
  app.notFound(() => new Response('Not Found', { status: 404 }))
  return withListener(app)
}

export declare namespace compose {
  type Options = {
    /** Mount path for every composed handler. @default "/" */
    path?: string | undefined
  }
}

/**
 * Augments a Hono app with a Node request `listener`.
 *
 * The listener is created lazily on first access. `getRequestListener`
 * (from `@hono/node-server`) overwrites the global `Request`/`Response` with
 * non-configurable Node polyfills the first time it runs; on edge runtimes
 * (Cloudflare Workers, Deno, Bun) that would replace the native `Response` and
 * make every `c.json()`/`c.html()` produce a value the runtime rejects. Edge
 * consumers only ever call `.fetch()` (or mount via `app.route(...)`) and never
 * touch `.listener`, so deferring its creation keeps the global `Response`
 * native there, while Node consumers (`http.createServer(ref.listener)`) get the
 * same behavior as before on first access.
 */
function withListener<app extends Hono>(app: app): Handler<app> {
  let listener: ReturnType<typeof getRequestListener> | undefined
  // Define the getter directly (not via `Object.assign`, which would invoke it
  // immediately while copying the property and defeat the laziness).
  Object.defineProperty(app, 'listener', {
    configurable: true,
    enumerable: true,
    get() {
      if (!listener) listener = getRequestListener((request) => app.fetch(request))
      return listener
    },
  })
  return app as Handler<app>
}
