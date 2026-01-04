import * as path from 'node:path'
import { config } from 'virtual:vocs/config'
import type { MiddlewareHandler } from 'hono'
import * as Markdown from '../../../internal/markdown.js'

export const mdRouter = (): MiddlewareHandler => {
  return async (context, next) => {
    if (!import.meta.env.PROD) return next()

    const request = context.req.raw
    const sourceDir = path.resolve(config.rootDir, config.outDir, 'public/assets/md')
    const content = await Markdown.fromRequest(request, sourceDir)

    if (!content) return next()

    context.res = new Response(content, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
    return
  }
}

export default mdRouter
