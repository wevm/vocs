import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'url'
import { compile as compile_, run } from '@mdx-js/mdx'
import debug_ from 'debug'
import { default as fs } from 'fs-extra'
import { globby } from 'globby'
import MiniSearch from 'minisearch'
import { Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as runtime from 'react/jsx-runtime'
import type { Plugin, UserConfig, ViteDevServer } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { slash } from '../utils/slash.js'
import { rehypePlugins, remarkPlugins } from './mdx.js'

const virtualModuleId = 'virtual:searchIndex'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

const debug = debug_('vocs:search')

type IndexObject = {
  href: string
  html: string
  id: string
  text: string
  title: string
  titles: string[]
}

export async function search(): Promise<Plugin> {
  const { config } = await resolveVocsConfig()

  function onIndexUpdated() {
    if (!server) return

    server.moduleGraph.onFileChange(resolvedVirtualModuleId)
    // HMR
    const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
    if (!mod) return

    server.ws.send({
      type: 'update',
      updates: [
        {
          acceptedPath: mod.url,
          path: mod.url,
          timestamp: Date.now(),
          type: 'js-update',
        },
      ],
    })
  }

  let index: MiniSearch<IndexObject>
  async function buildIndex({ prod }: { prod: boolean }) {
    const baseDir = config.rootDir
    const pagesPath = resolve(config.rootDir, 'pages')
    const pagesPaths = await globby(`${pagesPath}/**/*.{md,mdx}`)

    const documents = await Promise.all(
      pagesPaths.map(async (pagePath) => {
        const html = await compile(pagePath)

        const sections = splitPageIntoSections(html)
        if (sections.length === 0) return []

        const fileId = getDocId(baseDir, pagePath)

        const relFile = slash(relative(baseDir, fileId))
        const href = relFile.replace(relative(baseDir, pagesPath), '').replace(/\.(.*)/, '')

        return sections.map((section) => ({
          href: `${href}#${section.anchor}`,
          html: section.html,
          id: `${fileId}#${section.anchor}`,
          text: section.text,
          title: section.titles.at(-1)!,
          titles: section.titles.slice(0, -1),
        }))
      }),
    )

    index = new MiniSearch({
      fields: ['title', 'titles', 'text'],
      storeFields: ['href', 'html', 'text', 'title', 'titles'],
      // TODO
      // ...options.miniSearch?.options,
    })
    index.removeAll()
    await index.addAllAsync(documents.flat())

    debug(`vocs:search > indexed ${pagesPaths.length} files`)

    if (prod) {
      fs.ensureDir(join(config.rootDir, 'public/.vocs'))
      fs.writeJSONSync(join(config.rootDir, 'public/.vocs/search-index.json'), index.toJSON())
    }
  }

  let searchPromise: Promise<void> | undefined
  let server: ViteDevServer | undefined
  let viteConfig: UserConfig | undefined

  return {
    name: 'vocs:search',
    config(config) {
      viteConfig = config
      return {
        optimizeDeps: {
          include: ['vocs > minisearch'],
        },
      }
    },
    buildStart() {
      if (process.env.NODE_ENV !== 'development' && !viteConfig?.build?.ssr)
        searchPromise = buildIndex({ prod: true })
    },
    async buildEnd() {
      if (searchPromise) await searchPromise
    },
    async configureServer(devServer) {
      server = devServer
      await buildIndex({ prod: false })
      onIndexUpdated()
    },
    resolveId(id) {
      if (id !== virtualModuleId) return
      return resolvedVirtualModuleId
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return
      if (process.env.NODE_ENV === 'development')
        return `export const getSearchIndex = async () => ${JSON.stringify(JSON.stringify(index))}`
      return `export const getSearchIndex = async () => JSON.stringify(await ((await fetch("/.vocs/search-index.json")).json()))`
    },
    async handleHotUpdate({ file }) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) return

      const fileId = getDocId(config.rootDir, file)
      if (!existsSync(file)) return

      const rendered = await compile(file)
      const sections = splitPageIntoSections(rendered)
      if (sections.length === 0) return

      const pagesDirPath = resolve(config.rootDir, 'pages')
      const relativePagesDirPath = relative(config.rootDir, pagesDirPath)

      for (const section of sections) {
        const id = `${fileId}#${section.anchor}`
        if (index.has(id)) {
          index.discard(id)
        }
        const relFile = slash(relative(config.rootDir, fileId))
        const href = relFile.replace(relativePagesDirPath, '').replace(/\.(.*)/, '')
        index.add({
          href: `${href}#${section.anchor}`,
          html: section.html,
          id,
          text: section.text,
          title: section.titles.at(-1)!,
          titles: section.titles.slice(0, -1),
        })
      }

      debug('vocs:search > updated', file)

      onIndexUpdated()
    },
  }
}

async function compile(path: string) {
  try {
    const file = readFileSync(path, 'utf-8')
    const compiled = await compile_(file, {
      baseUrl: pathToFileURL(file).href,
      outputFormat: 'function-body',
      remarkPlugins,
      rehypePlugins,
    })
    const { default: MDXContent } = await run(compiled, { ...runtime, Fragment })
    const html = renderToStaticMarkup(
      MDXContent({
        // TODO: Pass components - vanilla extract and virtual module errors
        // components,
      }),
    )
    return html
  } catch (error) {
    // TODO: Resolve imports (e.g. virtual modules)
    return ''
  }
}

function getDocId(baseDir: string, file: string) {
  const relFile = slash(relative(baseDir, file))
  let id = slash(join(baseDir, relFile))
  id = id.replace(/(^|\/)index\.(mdx|html)?$/, '$1')
  return id
}

const headingRegex = /<h(\d*).*?>(.*?<a.*? href=".*?".*?>.*?<\/a>)<\/h\1>/gi
const headingContentRegex = /(.*?)<a.*? href=".*?#(.*?)".*?>.*?<\/a>/i

type PageSection = {
  anchor: string
  html: string
  titles: string[]
  text: string
}

function splitPageIntoSections(html: string) {
  const result = html.split(headingRegex)
  result.shift()

  let parentTitles: string[] = []
  const sections: PageSection[] = []
  for (let i = 0; i < result.length; i += 3) {
    const level = parseInt(result[i]) - 1
    const heading = result[i + 1]
    const headingResult = headingContentRegex.exec(heading)
    const title = clearHtmlTags(headingResult?.[1] ?? '').trim()
    const anchor = headingResult?.[2] ?? ''
    const content = result[i + 2]
    if (!title || !content) continue

    const titles = parentTitles.slice(0, level)
    titles[level] = title
    sections.push({ anchor, html: content, titles, text: getSearchableText(content) })

    if (level === 0) parentTitles = [title]
    else parentTitles[level] = title
  }

  return sections
}

function getSearchableText(content: string) {
  return clearHtmlTags(content)
}

function clearHtmlTags(str: string) {
  return str.replace(/<[^>]*>/g, '')
}
