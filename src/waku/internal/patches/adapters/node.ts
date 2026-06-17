import path from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import type { MiddlewareHandler } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { Hono } from 'hono/tiny'
import { unstable_createServerEntryAdapter as createServerEntryAdapter } from 'waku/adapter-builders'
import {
  unstable_constants as constants,
  unstable_honoMiddleware as honoMiddleware,
} from 'waku/internals'

const { DIST_PUBLIC } = constants
const { rscMiddleware, middlewareRunner } = honoMiddleware

const DEFAULT_BODY_LIMIT_MAX_SIZE = 100 * 1024 * 1024

type MiddlewareModules = Record<
  string,
  () => Promise<{ default: (opts: { app: Hono }) => MiddlewareHandler }>
>

const adapter: typeof import('waku/adapters/node').default = createServerEntryAdapter(
  ({ processRequest, processBuild, config, isBuild, notFoundHtml }, options) => {
    const {
      bodyLimit: bodyLimitOptions,
      middlewareFns = [],
      middlewareModules = {},
    } = options || {}
    const typedMiddlewareModules = middlewareModules as MiddlewareModules
    const app = new Hono()

    app.notFound((context) => {
      if (notFoundHtml) return context.html(notFoundHtml, 404)
      return context.text('404 Not Found', 404)
    })

    // This adapter intentionally mirrors Waku's Node adapter. Waku serves static
    // output before middleware in build mode, but Vocs needs mdRouter to run first
    // for partial-static clean URLs that negotiate `text/markdown`.
    if (isBuild && typedMiddlewareModules['mdRouter']) {
      const mdRouterMiddleware = middlewareRunner(
        {
          mdRouter: typedMiddlewareModules['mdRouter'],
        },
        { app },
      )
      app.use(`${config.basePath}*`, (context, next) => {
        const url = new URL(context.req.url)
        // Generated markdown assets are already static output. Passing them through
        // mdRouter here would route back to the same file.
        if (url.pathname.startsWith(`${config.basePath}assets/`)) return next()
        return mdRouterMiddleware(context, next)
      })
    }

    if (isBuild)
      app.use(
        `${config.basePath}*`,
        serveStatic({
          root: path.join(config.distDir, DIST_PUBLIC),
          rewriteRequestPath: (path) => path.slice(config.basePath.length - 1),
        }),
      )

    if (bodyLimitOptions !== false)
      app.use(bodyLimit(bodyLimitOptions ?? { maxSize: DEFAULT_BODY_LIMIT_MAX_SIZE }))
    for (const middlewareFn of middlewareFns) app.use(middlewareFn({ app }))
    app.use(middlewareRunner(typedMiddlewareModules, { app }))
    app.use(rscMiddleware({ processRequest }))

    return {
      fetch: app.fetch,
      build: processBuild,
      buildOptions: {
        distDir: config.distDir,
      },
      buildEnhancers: ['waku/adapters/node-build-enhancer'],
      serve,
    }
  },
)

export default adapter
