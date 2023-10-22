import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

import { dev } from './plugins/dev.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function createDevServer() {
  return createServer({
    root: __dirname,
    plugins: [dev()],
  })
}
