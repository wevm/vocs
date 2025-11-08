import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import pc from 'picocolors'
import type { Logger } from 'vite'
import { toMarkup } from './utils/html.js'
import { resolveOutDir } from './utils/resolveOutDir.js'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'
import { convertMdxToMarkdown } from './utils/mdxToMarkdown.js'

type PrerenderParameters = { logger?: Logger; outDir?: string }

export async function prerender({ logger, outDir }: PrerenderParameters) {
  const { config } = await resolveVocsConfig()
  const { basePath, rootDir } = config

  const outDir_resolved = resolveOutDir(rootDir, outDir)

  const template = readFileSync(resolve(outDir_resolved, 'index.html'), 'utf-8')

  const mod = await import(resolve(import.meta.dirname, './.vocs/dist/index.server.js'))

  // Get routes to prerender.
  const routes = getRoutes(resolve(rootDir, 'pages'))
  const pagesDir = resolve(rootDir, 'pages')

  // Prerender each route.
  for (const route of routes) {
    const body = await mod.prerender(route)

    const location = route.replace(/(.+)\/$/, '$1')
    const html = await toMarkup({
      body,
      config,
      head: <script src={`${basePath}/initializeTheme.iife.js`} />,
      location,
      template,
    })

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

    // Generate .md file for MDX pages
    const routeWithoutLeadingSlash = route.replace(/^\//, '')
    const possibleSources = [
      resolve(pagesDir, `${routeWithoutLeadingSlash}.mdx`),
      resolve(pagesDir, `${routeWithoutLeadingSlash}.md`),
      resolve(pagesDir, `${routeWithoutLeadingSlash}/index.mdx`),
      resolve(pagesDir, `${routeWithoutLeadingSlash}/index.md`),
    ]

    let sourceFile: string | null = null
    for (const src of possibleSources) {
      if (existsSync(src)) {
        sourceFile = src
        break
      }
    }

    if (sourceFile) {
      try {
        const markdown = await convertMdxToMarkdown(sourceFile)
        const mdFilePath = `${route}.md`.replace(/^\//, '')
        const mdPath = resolve(outDir_resolved, mdFilePath)
        const mdPathDir = dirname(mdPath)

        if (!isDir(mdPathDir)) mkdirSync(mdPathDir, { recursive: true })
        writeFileSync(mdPath, markdown)

        const mdFileName = mdPath.split('/').pop()!
        logger?.info(`${pc.dim(relative(rootDir, mdPath).replace(mdFileName, ''))}${pc.cyan(mdFileName)}`)
      } catch (error) {
        logger?.warn(`Failed to convert ${route} to markdown: ${error}`)
      }
    }
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
      const file = path.replace(routesDir, '').replace(/\.[^.]*$/, '')
      routes.push(file.endsWith('/index') ? file.replace(/index$/, '') : file)
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
