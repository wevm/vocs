import { App } from '@tinyhttp/app'
import { createServer as createDevServer } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as compression from 'compression'
import * as serveStatic from 'serve-static'

export type CreateServerParameters = {
  dev: boolean
}

export async function createServer(args: CreateServerParameters) {
  const { dev } = args

  const app = new App()

  const root = dev ? __dirname : resolve(__dirname, './dist/client')

  const devServer = await createDevServer({
    appType: 'custom',
    root,
    server: {
      middlewareMode: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  })

  // Middlewares
  if (dev) app.use(devServer.middlewares)
  // @ts-expect-error
  if (!dev) app.use(compression.default() as any)
  if (!dev)
    app.use(
      // @ts-expect-error
      serveStatic.default(root, {
        index: false,
      }),
    )

  // HTML
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      const template = await (async () => {
        const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf-8')
        if (dev) return devServer.transformIndexHtml(url, indexHtml)
        return indexHtml
      })()

      const module = await (async () => {
        if (dev) return devServer.ssrLoadModule(resolve(root, './app/index.server.tsx'))
        return import(resolve(root, '../server/index.server.js'))
      })()

      const context = { url: '' }
      const { head, body } = module.render(url, context)

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

  app.listen(5173, () => {
    console.log('http://localhost:5173')
  })
}
