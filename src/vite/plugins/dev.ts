import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PluginOption } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

const cleanUrl = (url: string): string => url.replace(/#.*$/s, '').replace(/\?.*$/s, '')

export function dev(): PluginOption {
  return {
    name: 'dev',
    configureServer(server) {
      return () => {
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
            const { head, body } = await module.render(req)
            const html = template
              .replace(/\.\.\/app/g, `/@fs${resolve(__dirname, '../../app')}`)
              .replace('<!--body-->', body)
              .replace('<!--head-->', head)
            res.end(html)
          } finally {
            next()
          }
        })
      }
    },
  }
}
