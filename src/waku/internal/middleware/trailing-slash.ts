import type { MiddlewareHandler } from 'hono'

export const trailingSlash = (): MiddlewareHandler => {
  return async (context, next) => {
    const url = new URL(context.req.url)

    // Skip root path and paths with file extensions
    if (url.pathname === '/' || /\.\w+$/.test(url.pathname)) return next()

    // Redirect trailing slash to non-trailing slash
    if (url.pathname.endsWith('/')) {
      const destination = new URL(url.pathname.slice(0, -1), url.origin)
      destination.search = url.search

      context.res = context.redirect(destination.toString(), 308)
      return
    }

    return next()
  }
}

export default trailingSlash
