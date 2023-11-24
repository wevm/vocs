import { resolve } from 'node:path'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { resolveVocsConfig } from './utils/resolveVocsConfig.js'
import { serveStatic } from './utils/serveStatic.js'

type PreviewParameters = {
  outDir?: string
}

export async function preview({ outDir = 'dist' }: PreviewParameters = {}) {
  const { config } = await resolveVocsConfig()
  const { root } = config

  const app = new Hono()
  app.use('/*', serveStatic({ root: resolve(root, outDir) }))

  return new Promise<ReturnType<typeof serve> & { port: number }>((res) => {
    async function createServer(port = 4173) {
      process.on('uncaughtException', (err: any) => {
        if (err.code !== 'EADDRINUSE') throw err
        process.removeAllListeners()
        createServer(port + 1)
      })

      const server = serve({
        fetch: app.fetch,
        port,
      }).on('listening', () => {
        res(Object.assign(server, { port }))
      })
    }

    createServer()
  })
}
