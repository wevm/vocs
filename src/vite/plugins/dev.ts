import { accessSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { default as serveStatic } from 'serve-static'
import type { PluginOption } from 'vite'
import { globby } from 'globby'

import type { ParsedConfig } from '../../config.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const cleanUrl = (url: string): string => url.replace(/#.*$/s, '').replace(/\?.*$/s, '')

export function dev(): PluginOption {
  let config = {} as ParsedConfig
  const styleSet = new Map()
  const styleOverrideSet = new Map()
  return {
    name: 'dev',
    async buildStart() {
      config = (await resolveVocsConfig()).config
    },
    transform(styles, id) {
      const { rootDir } = config
      if (id.endsWith('.css')) {
        if (id.endsWith('.vocs/theme.css')) styleOverrideSet.set(id, styles)
        else if (id === resolve(rootDir, 'styles.css')) styleOverrideSet.set(id, styles)
        else styleSet.set(id, styles)
      }
    },
    async configureServer(server) {
      const { config } = await resolveVocsConfig()
      const { rootDir } = config
      const publicUrl = resolve(rootDir, 'public');
      const base = config.baseUrl;
      const vocsPublic = resolve(__dirname, '../../app/public');

      server.middlewares.use((req, res, next) => {
        if(!base) {
          return next();
        }
        // rewrite file path when base setted
        if(base && req.url?.startsWith(base) && base !== req.url) {
          const urlExcludeBase = (req.url as string).replace(base, '')
          if(urlExcludeBase !== '/') {
            const filePath = join(publicUrl, urlExcludeBase)
            const filePathInVocs = join(vocsPublic, urlExcludeBase)

            if(isFile(filePath) || isFile(filePathInVocs)) {
              req.url = urlExcludeBase;
            }
            return next();
          }
        }
        next();
      })

      server.middlewares.use(serveStatic(publicUrl))
      server.middlewares.use(serveStatic(vocsPublic))

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
            const template = await server.transformIndexHtml(
              url!,
              indexHtml.replace(/\.\.\/app/g, `/@fs${resolve(__dirname, '../../app')}`),
            )
            const module = await server.ssrLoadModule(
              resolve(__dirname, '../../app/index.server.tsx'),
            )
            const render = await module.render(req)

            const styles = [...styleSet.values(), ...styleOverrideSet.values()]
              .map((style) => `<style data-vocs-temp-style="true">${style}</style>`)
              .join('')

            const head = `${render.head}${styles}`
            const body = render.body

            const html = template.replace('<!--head-->', head).replace('<!--body-->', body)

            res.end(html)
          } finally {
            next()
          }
        })
      }
    },
  }
}

function isFile(path:string){
  try {
    const stats = statSync(path)
    if(stats.isFile()) {
      return true;
    }
  } catch(err){}
  return false;
}

async function isRoutePath(rootDir:string, path:string){

}