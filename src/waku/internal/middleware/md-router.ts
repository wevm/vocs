import type { MiddlewareHandler } from 'hono'
import * as MdRouter from '../../../server/md-router.handler.js'

export const mdRouter = (): MiddlewareHandler => {
  return async (context, next) => {
    if (import.meta.env.DEV) return next()

    const request = context.req.raw
    const response = await MdRouter.fetch(request).catch(() => undefined)
    if (response) {
      context.res = response
      return
    }

    return next()
  }
}

export default mdRouter
