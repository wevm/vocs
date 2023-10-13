import { App } from '@tinyhttp/app'
import { createServer as createDevServer } from 'vite'
import { resolve } from 'node:path'
import compression from 'compression'
import serveStatic from 'serve-static'

createServer()

export async function createServer() {
  const app = new App()
  
  const cwd = import.meta.dir
  const prod = process.env.NODE_ENV === 'production'
  const root = prod ? resolve(cwd, './dist/client') : cwd
  
  const devServer = await createDevServer({
    appType: 'custom',
    server: {
      middlewareMode: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  })
  
  // Middlewares
  if (!prod) app.use(devServer.middlewares)
  if (prod) app.use(compression() as any)
  if (prod)
    app.use(
      serveStatic(root, {
        index: false,
      }),
    )
  
  // HTML
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl
  
      const template = await (async () => {
        const indexHtml = await Bun.file(resolve(root, 'index.html')).text()
        if (prod) return indexHtml
        return devServer.transformIndexHtml(url, indexHtml)
      })()
  
      const module = await (async () => {
        if (prod) return import(resolve(root, '../server/index.server.js'))
        return devServer.ssrLoadModule(resolve(root, './src/index.server.tsx'))
      })()
  
      const context = { url: '' }
      const { head, body } = module.render(url, context)
  
      if (context.url) return res.redirect(context.url, 301)
  
      const html = template.replace('<!--body-->', body).replace('<!--head-->', head)
  
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      const err = e as Error
      if (!prod) devServer.ssrFixStacktrace(err)
      console.log(err.stack)
      res.status(500).end(err.stack)
    }
    return
  })
  
  app.listen(5173, () => {
    console.log('http://localhost:5173')
  })
}

