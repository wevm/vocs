import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { PluginOption } from 'vite'

const root = process.cwd()

type PrerenderPluginParameters = { outDir?: string }

export function prerender({ outDir = 'dist' }: PrerenderPluginParameters): PluginOption {
  return {
    name: 'prerender',
    async closeBundle() {
      const outDir_resolved = resolve(root, outDir)

      const template = readFileSync(resolve(outDir_resolved, 'index.html'), 'utf-8')
      const mod = await import(resolve(outDir_resolved, 'index.server.js'))

      // Get routes to prerender.
      const routes = getRoutes(resolve(root, 'pages'))

      // Prerender each route.
      for (const route of routes) {
        const { head, body } = await mod.prerender(route)
        const html = template
          .replace('<!--body-->', body)
          .replace('<!--head-->', head)
          .replace('/app/utils/initialize-theme.ts', '/initialize-theme.iife.js')
        const filePath = `${route.endsWith('/') ? `${route}index` : route}.html`.replace(/^\//, '')
        const path = resolve(outDir_resolved, filePath)
        const pathDir = dirname(path)

        if (!isDir(pathDir)) mkdirSync(pathDir, { recursive: true })
        writeFileSync(path, html)
        console.log('Prerendered:', path)
      }
    },
  }
}

////////////////////////////////////////////////////////////////////////
// Utils

function getRoutes(routesDir: string) {
  const routes: string[] = []

  function recurseRoutes(dir: string) {
    for (const fileOrDir of readdirSync(dir)) {
      const path = resolve(dir, fileOrDir)
      if (isDir(path)) {
        recurseRoutes(path)
        continue
      }
      const file = path.replace(routesDir, '').replace(/\..*$/, '')
      routes.push(file.endsWith('/index') ? file.replace('index', '') : file)
    }
  }
  recurseRoutes(routesDir)

  return routes
}

function isDir(dir: string) {
  try {
    readdirSync(dir)
    return true
  } catch {
    return false
  }
}
