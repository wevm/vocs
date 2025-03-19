import { createServer } from 'vite'

import { dev } from './plugins/dev.js'
import * as cache from './utils/cache.js'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'

export type CreateDevServerParameters = {
  clean?: boolean
  host?: boolean
  port?: number
}

export async function createDevServer(params: CreateDevServerParameters = {}) {
  const { config } = await resolveVocsConfig()
  const { cacheDir } = config
  if (params.clean) cache.clear({ cacheDir })
  return createServer({
    root: import.meta.dirname,
    server: {
      host: params.host,
      port: params.port,
    },
    plugins: [dev()],
  })
}
