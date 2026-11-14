/// <reference types="vocs/vite/virtual" />
/**
 * The host app's Worker. Requests under `/docs` go to Vocs; everything else is the app's.
 * @module
 */
import config from 'virtual:vocs/config'
import { Handler } from 'vocs/server'

const docs = Handler.from(config, { basePath: '/docs', rateLimit: 'MODEL_RATE_LIMIT' })

export default {
  fetch(request: Request, env: Record<string, unknown>, ctx: unknown) {
    if (new URL(request.url).pathname.startsWith('/docs/')) return docs.fetch(request, env, ctx)
    return new Response('Not found', { status: 404 })
  },
}
