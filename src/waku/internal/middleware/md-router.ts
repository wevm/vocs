import type { MiddlewareHandler } from 'hono'
import * as Markdown from '../../../internal/markdown.js'

export const mdRouter = (): MiddlewareHandler => {
  return async (context, next) => {
    if (import.meta.env.DEV) return next()

    const request = context.req.raw
    const content = await Markdown.fromRequest(request)

    if (!content) return next()

    context.res = new Response(content, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
    return
  }
}

export default mdRouter
