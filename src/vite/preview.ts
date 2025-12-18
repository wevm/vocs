import { resolve } from 'node:path'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { compress } from 'hono/compress'

import { resolveVocsConfig } from './utils/resolveVocsConfig.js'
import { serveStatic } from './utils/serveStatic.js'

type PreviewParameters = {
  outDir?: string
}

export async function preview({ outDir = 'dist' }: PreviewParameters = {}) {
  const { config } = await resolveVocsConfig()
  const { basePath, rootDir } = config

  const app = new Hono()

  app.use('*', compress())
  app.use(
    '/*',
    serveStatic({
      root: resolve(rootDir, outDir),
      rewriteRequestPath(path) {
        return basePath ? path.replace(basePath!, '') : path
      },
    }),
  )

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
