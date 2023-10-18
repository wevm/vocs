import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { App } from '@tinyhttp/app'
import * as compression from 'compression'
import * as serveStatic from 'serve-static'
import { createServer as createDevServer } from 'vite'

export type CreateServerParameters = {
  dev?: boolean
  ssr?: boolean
}

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function createServer(args: CreateServerParameters = {}) {
  const { dev, ssr } = args

  const outDir = 'dist'
  const root = dev ? __dirname : process.cwd()
  const clientRoot = dev ? root : resolve(root, outDir, 'client')
  const serverRoot = dev ? root : resolve(root, outDir, 'server')

  const devServer = dev
    ? await createDevServer({
        appType: 'custom',
        configFile: resolve(__dirname, 'vite.config.ts'),
        root,
        server: {
          middlewareMode: true,
          watch: {
            usePolling: true,
            interval: 100,
          },
        },
      })
    : undefined
  const server = new App()

  // Middlewares
  if (devServer) server.use(devServer.middlewares)

  // If not SSR, then we are serving a static build.
  // @ts-expect-error
  if (!ssr) server.use(serveStatic.default(resolve(root, outDir)))

  // If SSR, then we are serving a SSR build.
  if (ssr) {
    // @ts-expect-error
    if (!dev) server.use(compression.default())
    if (!dev)
      server.use(
        // @ts-expect-error
        serveStatic.default(clientRoot, {
          index: false,
        }),
      )

    // @ts-expect-error
    server.use(serveStatic.default(resolve(root, 'public')))

    // React → HTML
    server.use('*', async (req, res) => {
      try {
        const url = req.originalUrl

        const template = await (async () => {
          const indexHtml = readFileSync(resolve(clientRoot, 'index.html'), 'utf-8')
          if (devServer) return devServer.transformIndexHtml(url, indexHtml)
          return indexHtml
        })()

        const module = await (async () => {
          if (devServer) return devServer.ssrLoadModule(resolve(root, './app/index.server.tsx'))
          return import(resolve(serverRoot, 'index.server.js'))
        })()

        const context = { url: '' }
        const { head, body } = await module.render(req)

        if (context.url) return res.redirect(context.url, 301)

        const html = template.replace('<!--body-->', body).replace('<!--head-->', head)

        res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      } catch (e) {
        const err = e as Error
        if (devServer) devServer.ssrFixStacktrace(err)
        console.log(err.stack)
        res.status(500).end(err.stack)
      }
      return
    })
  }

  server.listen(5173, () => {
    console.log('http://localhost:5173')
  })
}
