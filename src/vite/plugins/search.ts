import { existsSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { compile, run } from '@mdx-js/mdx'
import debug_ from 'debug'
import { readFile } from 'fs/promises'
import { globby } from 'globby'
import MiniSearch from 'minisearch'
import { Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as runtime from 'react/jsx-runtime'
import { type Plugin, type ViteDevServer } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { slash } from '../utils/slash.js'
import { rehypePlugins, remarkPlugins } from './mdx.js'

const virtualModuleId = 'virtual:searchIndex'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

const debug = debug_('vocs:search')

type IndexObject = {
  href: string
  id: string
  text: string
  title: string
  titles: string[]
}

export async function search(): Promise<Plugin> {
  const { config } = await resolveVocsConfig()
  console.log(resolvedVirtualModuleId)

  async function render(file: string) {
    try {
      const src = await readFile(file, 'utf-8')
      const test = await compile(src, {
        baseUrl: pathToFileURL(file).href,
        outputFormat: 'function-body',
        remarkPlugins,
        rehypePlugins,
      })
      const { default: MDXContent } = await run(test, { ...runtime, Fragment })
      const html = renderToStaticMarkup(MDXContent({}))
      return html
    } catch (error) {
      // TODO: Support imports
      console.log(file, (error as Error).message)
      return ''
    }
  }

  function onIndexUpdated() {
    if (!server) return

    server.moduleGraph.onFileChange(resolvedVirtualModuleId)
    // HMR
    const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
    console.log('onIndexUpdated', server.moduleGraph)
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

  function getDocId(file: string) {
    const relFile = slash(path.relative(config.rootDir, file))
    // relFile = siteConfig.rewrites.map[relFile] || relFile
    let id = slash(path.join(config.rootDir, relFile))
    id = id.replace(/(^|\/)index\.mdx?$/, '$1')
    return id
  }

  let index: MiniSearch<IndexObject>
  function getIndex() {
    if (!index) {
      index = new MiniSearch<IndexObject>({
        fields: ['title', 'titles', 'text'],
        storeFields: ['href', 'title', 'titles'],
        // TODO
        // ...options.miniSearch?.options,
      })
    }
    return index
  }

  async function scanForBuild() {
    const pagesDirPath = path.resolve(config.rootDir, 'pages')
    const relativePagesDirPath = path.relative(config.rootDir, pagesDirPath)

    const pagesPaths = await globby(`${pagesDirPath}/**/*.{md,mdx}`)
    const documents = []
    for (const pagePath of pagesPaths) {
      const fileId = getDocId(pagePath)
      const rendered = await render(pagePath)
      const sections = splitPageIntoSections(rendered)
      if (sections.length === 0) continue

      const relFile = slash(path.relative(config.rootDir, fileId))
      const href = relFile.replace(relativePagesDirPath, '').replace(/\.(.*)/, '')

      documents.push(
        ...sections.map((section) => ({
          href: `${href}#${section.anchor}`,
          id: `${fileId}#${section.anchor}`,
          text: section.text,
          title: section.titles.at(-1)!,
          titles: section.titles.slice(0, -1),
        })),
      )
    }

    const index = getIndex()
    index.removeAll()
    await index.addAllAsync(documents)

    debug(`vocs:search > indexed ${pagesPaths.length} files`)
  }

  let server: ViteDevServer | undefined

  return {
    name: 'vocs:search',
    config: () => ({
      optimizeDeps: {
        include: ['vocs > minisearch'],
      },
    }),
    async configureServer(devServer) {
      console.log('configureServer')
      server = devServer
      await scanForBuild()
      onIndexUpdated()
    },
    resolveId(id) {
      if (id !== virtualModuleId) return
      console.log('resolveId', id)
      return resolvedVirtualModuleId
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return
      console.log('load', id)

      if (process.env.NODE_ENV === 'production') await scanForBuild()
      return `export const searchIndex = ${JSON.stringify(JSON.stringify(getIndex()))}`
    },
    async handleHotUpdate({ file }) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) return

      console.log('hadleHotUpdate', file)
      const fileId = getDocId(file)
      if (!existsSync(file)) return

      const rendered = await render(file)
      const sections = splitPageIntoSections(rendered)
      if (sections.length === 0) return

      const index = getIndex()
      for (const section of sections) {
        const id = `${fileId}#${section.anchor}`
        if (index.has(id)) {
          index.discard(id)
        }
        index.add({
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

const headingRegex = /<h(\d*).*?>(.*?<a.*? href=".*?".*?>.*?<\/a>)<\/h\1>/gi
const headingContentRegex = /(.*?)<a.*? href=".*?#(.*?)".*?>.*?<\/a>/i

type PageSection = {
  anchor: string
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
    sections.push({ anchor, titles, text: getSearchableText(content) })

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
