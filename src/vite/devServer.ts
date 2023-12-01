import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

import { dev } from './plugins/dev.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export type CreateDevServerParameters = {
  host?: boolean
  port?: number
}

export async function createDevServer(params: CreateDevServerParameters = {}) {
  return createServer({
    root: __dirname,
    server: {
      host: params.host,
      port: params.port,
    },
    plugins: [dev()],
  })
}
