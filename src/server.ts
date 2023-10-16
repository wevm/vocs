import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { App } from '@tinyhttp/app'
import * as compression from 'compression'
import * as serveStatic from 'serve-static'
import { createServer as createDevServer } from 'vite'

export type CreateServerParameters = {
  dev?: boolean
}

const dir = resolve(fileURLToPath(import.meta.url), '..')

export async function createServer(args: CreateServerParameters = {}) {
  const { dev } = args

  const outDir = 'dist'
  const root = dev ? dir : process.cwd()
  const clientRoot = dev ? root : resolve(root, outDir, 'client')
  const serverRoot = dev ? root : resolve(root, outDir, 'server')

  const devServer = await createDevServer({
    appType: 'custom',
    configFile: resolve(dir, 'vite.config.ts'),
    root,
    server: {
      middlewareMode: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  })

  const server = new App()

  // Middlewares
  if (dev) server.use(devServer.middlewares)
  // @ts-expect-error
  if (!dev) server.use(compression.default())
  if (!dev)
    server.use(
      // @ts-expect-error
      serveStatic.default(clientRoot, {
        index: false,
      }),
    )

  // Static files
  // @ts-expect-error
  server.use(serveStatic.default(resolve(__dirname, 'public')))
  // @ts-expect-error
  server.use(serveStatic.default(resolve(root, 'public')))

  // React → HTML
  server.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      const template = await (async () => {
        const indexHtml = readFileSync(resolve(clientRoot, 'index.html'), 'utf-8')
        if (dev) return devServer.transformIndexHtml(url, indexHtml)
        return indexHtml
      })()

      const module = await (async () => {
        if (dev) return devServer.ssrLoadModule(resolve(root, './app/index.server.tsx'))
        return import(resolve(serverRoot, 'index.server.js'))
      })()

      const context = { url: '' }
      const { head, body } = await module.render(req)

      if (context.url) return res.redirect(context.url, 301)

      const html = template.replace('<!--body-->', body).replace('<!--head-->', head)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      const err = e as Error
      if (dev) devServer.ssrFixStacktrace(err)
      console.log(err.stack)
      res.status(500).end(err.stack)
    }
    return
  })

  server.listen(5173, () => {
    console.log('http://localhost:5173')
  })
}
