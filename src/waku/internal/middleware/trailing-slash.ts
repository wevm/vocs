import type { MiddlewareHandler } from 'hono'
import { appendSearch } from '../../../internal/redirects.js'

/**
 * Removes trailing slashes from URLs.
 *
 * Redirects `/about/` → `/about` with a 308 Permanent Redirect.
 * Skips the root path (`/`) and paths with file extensions.
 *
 * Uses relative Location values so redirects work correctly behind
 * TLS-terminating reverse proxies, where the internal request URL
 * may use `http://`.
 */
export const trailingSlash = (): MiddlewareHandler => {
  return async (context, next) => {
    const url = new URL(context.req.url)

    // Skip root path and paths with file extensions
    if (url.pathname === '/' || /\.\w+$/.test(url.pathname)) return next()

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
