import type { MiddlewareHandler } from 'hono'
import * as Config from '../../../internal/config.js'
import * as Redirects from '../../../internal/redirects.js'

export const redirects = (): MiddlewareHandler => {
  return async (context, next) => {
    const config = await Config.resolve()
    if (!config.redirects?.length) return next()

    const rules = Redirects.from(config.redirects)
    if (!rules?.length) return next()

    const url = new URL(context.req.url)
    const result = Redirects.resolve(url.pathname, rules)
    if (!result) return next()

    const destination = new URL(result.destination, url.origin)
    destination.search = url.search

    return context.redirect(destination.toString(), result.status as 301 | 302 | 303 | 307 | 308)
  }
}

export default redirects
