import { existsSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import MiniSearch from 'minisearch'
import { type Plugin, type ViteDevServer, createLogger } from 'vite'

import * as cache from '../utils/cache.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { buildIndex, debug, getDocId, processMdx, splitPageIntoSections } from '../utils/search.js'
import { slash } from '../utils/slash.js'

const virtualModuleId = 'virtual:searchIndex'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

const logger = createLogger()

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

  let index: MiniSearch<IndexObject>
  let server: ViteDevServer | undefined

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

  return {
    name: 'vocs:search',
    config() {
      return {
        optimizeDeps: {
          include: ['vocs > minisearch'],
        },
      }
    },
    async buildStart() {
      const dev = process.env.NODE_ENV === 'development'
      if (dev) {
        logger.info('building search index...', { timestamp: true })
        index = await buildIndex({ baseDir: config.rootDir, processMdx })
        onIndexUpdated()
      }
    },
    async configureServer(devServer) {
      server = devServer
    },
    resolveId(id) {
      if (id !== virtualModuleId) return
      return resolvedVirtualModuleId
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return
      if (process.env.NODE_ENV === 'development')
        return `export const getSearchIndex = async () => ${JSON.stringify(JSON.stringify(index))}`
      const hash = cache.search.get('hash')
      return `export const getSearchIndex = async () => JSON.stringify(await ((await fetch("/.vocs/search-index-${hash}.json")).json()))`
    },
    async handleHotUpdate({ file }) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) return

      const fileId = getDocId(config.rootDir, file)
      if (!existsSync(file)) return

      const mdx = readFileSync(file, 'utf-8')
      const rendered = await processMdx(mdx)
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
