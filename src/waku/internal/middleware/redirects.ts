import type { MiddlewareHandler } from 'hono'
import * as Config from '../../../internal/config.js'
import * as Redirects from '../../../internal/redirects.js'

/**
 * Applies configured redirects.
 *
 * Uses relative Location values for relative destinations so redirects work
 * correctly behind TLS-terminating reverse proxies, where the internal
 * request URL may use `http://`.
 */
export const redirects = (): MiddlewareHandler => {
  return async (context, next) => {
    const config = await Config.resolve({ server: true })
    if (!config.redirects?.length) return next()

    const rules = Redirects.from(config.redirects)
    if (!rules?.length) return next()

    const url = new URL(context.req.url)
    const result = Redirects.resolve(url.pathname, rules)
    if (!result) return next()

    const destination = Redirects.appendSearch(result.destination, url.search)

    context.res = context.redirect(destination, result.status as 301 | 302 | 303 | 307 | 308)
    return
  }
}

export default redirects
