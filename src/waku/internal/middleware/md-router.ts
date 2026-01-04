import type { MiddlewareHandler } from 'hono'
import * as Markdown from '../../../internal/markdown.js'

export const mdRouter = (): MiddlewareHandler => {
  return async (context, next) => {
    if (import.meta.env.DEV) return next()

    const request = context.req.raw
    const result = await Markdown.fromRequest(request)

    if (!result) return next()

    context.res = new Response(result.content, {
      headers: { 'Content-Type': result.contentType },
    })
    return
  }
}

export default mdRouter
