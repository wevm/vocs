import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { default as serveStatic } from 'serve-static'
import type { PluginOption } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

const cleanUrl = (url: string): string => url.replace(/#.*$/s, '').replace(/\?.*$/s, '')

export function dev(): PluginOption {
  const cssPaths = new Set()
  return {
    name: 'dev',
    load(id) {
      if (id.includes(process.cwd()) && id.endsWith('.css')) cssPaths.add(id)
    },
    configureServer(server) {
      return () => {
        server.middlewares.use(serveStatic(resolve(process.cwd(), 'public')))
        server.middlewares.use(async (req, res, next) => {
          const url = req.url && cleanUrl(req.url)

          if (!url?.endsWith('.html')) {
            next()
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          try {
            if (typeof url === 'undefined') next()

            const indexHtml = readFileSync(resolve(__dirname, '../index.html'), 'utf-8')
            const template = await server.transformIndexHtml(url!, indexHtml)
            const module = await server.ssrLoadModule(
              resolve(__dirname, '../../app/index.server.tsx'),
            )
            const render = await module.render(req)

            const css = [...cssPaths]
              .map((path) => `<link rel="stylesheet" href="/@fs${path}">`)
              .join('')

            const head = `${render.head}${css}`
            const body = render.body

            const html = template
              .replace('<!--head-->', head)
              .replace('<!--body-->', body)
              .replace(/\.\.\/app/g, `/@fs${resolve(__dirname, '../../app')}`)

            res.end(html)
          } finally {
            next()
          }
        })
      }
    },
  }
}
