import type { MiddlewareHandler } from 'hono'
import * as Config from '../../../internal/config.js'
import { appendSearch } from '../../../internal/redirects.js'

const normalizeBasePath = (basePath: string) => (basePath.endsWith('/') ? basePath : `${basePath}/`)

/**
 * Normalizes trailing slashes on page URLs (e.g. `/about/` → `/about`).
 *
 * By default, redirects `/about/` → `/about` with a 308 Permanent Redirect.
 *
 * When `redirect` is `false`, the trailing slash is stripped internally for
 * downstream routing instead of emitting a redirect. This avoids redirect
 * loops when an upstream host (reverse proxy / CDN) owns trailing-slash
 * canonicalization and adds the trailing slash that Vocs would otherwise
 * strip — particularly when the upstream rewrites the path so the redirect
 * `Location` would lose its public prefix.
 *
 * Skips the root path (`/`), the configured base path root, and paths with
 * file extensions.
 *
 * Uses relative Location values so redirects work correctly behind
 * TLS-terminating reverse proxies, where the internal request URL
 * may use `http://`.
 */
export const trailingSlash = (options: trailingSlash.Options = {}): MiddlewareHandler => {
  const optionsPromise =
    options.basePath !== undefined || options.redirect !== undefined
      ? Promise.resolve({
          basePath: normalizeBasePath(options.basePath ?? '/'),
          redirect: options.redirect ?? true,
        })
      : Config.resolve({ server: true }).then((config) => ({
          basePath: normalizeBasePath(config.basePath),
          redirect: config.trailingSlashRedirect,
        }))

  return async (context, next) => {
    const url = new URL(context.req.url)
    const { basePath, redirect } = await optionsPromise

    // Skip root path, base path root, and paths with file extensions
    if (url.pathname === '/' || url.pathname === basePath || /\.\w+$/.test(url.pathname))
      return next()

    if (url.pathname.endsWith('/')) {
      const pathname = url.pathname.slice(0, -1)

      // Emit a redirect to the no-slash form (default).
      if (redirect) {
        const destination = appendSearch(pathname, url.search)
        context.res = context.redirect(destination, 308)
        return
      }

      // Otherwise, normalize the path internally (no redirect) so downstream
      // routing matches the no-slash route. Preserves the query string.
      url.pathname = pathname
      context.req.raw = new Request(url, context.req.raw)
      return next()
    }

    return next()
  }
}

export default trailingSlash

export declare namespace trailingSlash {
  type Options = {
    basePath?: string | undefined
    /**
     * Whether to emit a 308 redirect to the no-slash form. When `false`, the
     * trailing slash is stripped internally for routing without a redirect.
     *
     * @default true
     */
    redirect?: boolean | undefined
  }
}
