import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { type ServeStaticOptions, serveStatic } from '@hono/node-server/serve-static'
import type { MiddlewareHandler } from 'hono'
import { isWithin } from '../../../../internal/file-boundary.js'

export function serveStaticWithinRoot(options: ServeStaticOptions): MiddlewareHandler {
  const staticMiddleware = serveStatic(options)
  const root = path.resolve(options.root ?? '')

  return async (context, next) => {
    let filename: string
    try {
      filename = decodeURI(context.req.path)
    } catch {
      return context.notFound()
    }

    const rewritten = options.rewriteRequestPath?.(filename, context) ?? filename
    const file = path.resolve(root, `.${rewritten.startsWith('/') ? rewritten : `/${rewritten}`}`)
    if (!isWithin(root, file)) return context.notFound()

    try {
      const realRoot = await fs.realpath(root)
      const stats = await fs.stat(file)
      const target = stats.isDirectory() ? path.join(file, options.index ?? 'index.html') : file
      const realTarget = await fs.realpath(target)
      if (!isWithin(realRoot, realTarget)) return context.notFound()
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }

    return staticMiddleware(context, next)
  }
}
