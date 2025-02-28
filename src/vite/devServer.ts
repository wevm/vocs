import { createServer } from 'vite'

import { dev } from './plugins/dev.js'
import * as cache from './utils/cache.js'

export type CreateDevServerParameters = {
  clean?: boolean
  host?: boolean
  port?: number
}

export async function createDevServer(params: CreateDevServerParameters = {}) {
  if (params.clean) cache.clear()
  return createServer({
    root: import.meta.dirname,
    server: {
      host: params.host,
      port: params.port,
    },
    plugins: [dev()],
  })
}
