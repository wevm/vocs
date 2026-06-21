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

  app.get('*', async (c) => {
    const { pathname } = new URL(c.req.url)

    // Serve a bundled asset if the path targets the asset root.
    const asset = Assets.match(pathname)
    if (asset) return Assets.response(asset)

    // Otherwise render the HTML shell (client-side router takes over).
    const payload = await prepare()
    const manifest = Assets.manifest()
    if (!manifest.built)
      return c.text(
        '[vocs] The standalone OpenAPI bundle has not been built. Run `pnpm build` (or install a published build of `vocs`).',
        500,
      )
    // Infer the host mount prefix so asset URLs route back to this handler
    // regardless of where it is mounted (and independent of a trailing slash).
    const mount = inferMount(pathname, knownRoutes(payload))
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
  }
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

/** Augments a Hono app with a Node request `listener`. */
function withListener<app extends Hono>(app: app): Handler<app> {
  return Object.assign(app, {
    listener: getRequestListener((request) => app.fetch(request)),
  })
}
