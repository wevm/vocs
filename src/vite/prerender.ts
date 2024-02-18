import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'
import type { Logger } from 'vite'
import { resolveOutDir } from './utils/resolveOutDir.js'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'

type PrerenderParameters = { logger?: Logger; outDir?: string }

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function prerender({ logger, outDir }: PrerenderParameters) {
  const { config } = await resolveVocsConfig()
  const { basePath, rootDir } = config

  const outDir_resolved = resolveOutDir(rootDir, outDir)

  const template = readFileSync(resolve(outDir_resolved, 'index.html'), 'utf-8')
  const mod = await import(resolve(__dirname, './.vocs/dist/index.server.js'))

  // Get routes to prerender.
  const routes = getRoutes(resolve(rootDir, 'pages'))

  // Prerender each route.
  for (const route of routes) {
    const { head, body } = await mod.prerender(route)
    const html = template
      .replace('<!--body-->', body)
      .replace('<!--head-->', head)
      .replace('../app/utils/initializeTheme.ts', `${basePath}/initializeTheme.iife.js`)
    const isIndex = route.endsWith('/')
    const filePath = `${isIndex ? `${route}index` : route}.html`.replace(/^\//, '')
    const path = resolve(outDir_resolved, filePath)

    const pathDir = dirname(path)
    if (!isDir(pathDir)) mkdirSync(pathDir, { recursive: true })

    if (isIndex) writeFileSync(path, html)
    else {
      const path = resolve(outDir_resolved, route.slice(1))
      if (!isDir(path)) mkdirSync(path, { recursive: true })
      writeFileSync(resolve(path, 'index.html'), html)
    }

    const fileName = path.split('/').pop()!
    logger?.info(`${pc.dim(relative(rootDir, path).replace(fileName, ''))}${pc.cyan(fileName)}`)
  }

  logger?.info(`\n${pc.green('✓')} ${routes.length} pages prerendered.`)
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
