import type { MiddlewareHandler } from 'hono'
import * as Config from '../../../internal/config.js'
import { appendSearch } from '../../../internal/redirects.js'

const normalizeBasePath = (basePath: string) => (basePath.endsWith('/') ? basePath : `${basePath}/`)

/**
 * Removes trailing slashes from URLs.
 *
 * Redirects `/about/` → `/about` with a 308 Permanent Redirect.
 * Skips the root path (`/`), configured base path root, and paths with file
 * extensions.
 *
 * Uses relative Location values so redirects work correctly behind
 * TLS-terminating reverse proxies, where the internal request URL
 * may use `http://`.
 */
export const trailingSlash = (options: trailingSlash.Options = {}): MiddlewareHandler => {
  const basePathPromise =
    options.basePath !== undefined
      ? Promise.resolve(normalizeBasePath(options.basePath))
      : Config.resolve({ server: true }).then((config) => normalizeBasePath(config.basePath))

  return async (context, next) => {
    const url = new URL(context.req.url)
    const basePath = await basePathPromise

    // Skip root path, base path root, and paths with file extensions
    if (url.pathname === '/' || url.pathname === basePath || /\.\w+$/.test(url.pathname))
      return next()

    // Redirect trailing slash to non-trailing slash
    if (url.pathname.endsWith('/')) {
      const destination = appendSearch(url.pathname.slice(0, -1), url.search)
      context.res = context.redirect(destination, 308)
      return
    }

    return next()
  }
}

export default trailingSlash

export declare namespace trailingSlash {
  type Options = {
    basePath?: string | undefined
  }
}
