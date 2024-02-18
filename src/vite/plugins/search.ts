import { existsSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import MiniSearch from 'minisearch'
import { type Plugin, type UserConfig, type ViteDevServer, createLogger } from 'vite'

import * as cache from '../utils/cache.js'
import { hash as hash_ } from '../utils/hash.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import {
  buildIndex,
  debug,
  getDocId,
  processMdx,
  saveIndex,
  splitPageIntoSections,
} from '../utils/search.js'
import { slash } from '../utils/slash.js'

const virtualModuleId = 'virtual:searchIndex'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

const logger = createLogger()

type IndexObject = {
  href: string
  html: string
  id: string
  isPage: boolean
  text: string
  title: string
  titles: string[]
}

const dev = process.env.NODE_ENV === 'development'

export async function search(): Promise<Plugin> {
  const { config } = await resolveVocsConfig()

  let hash: string | undefined
  let index: MiniSearch<IndexObject>
  let searchPromise: Promise<MiniSearch<IndexObject>> | undefined
  let server: ViteDevServer | undefined
  let viteConfig: UserConfig | undefined

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
    config(config) {
      viteConfig = config
      return {
        optimizeDeps: {
          include: ['vocs > minisearch'],
        },
      }
    },
    async buildStart() {
      if (!viteConfig?.build?.ssr) {
        const buildSearchIndex = cache.search.get('buildSearchIndex')
        if (!dev && !buildSearchIndex) return

        searchPromise = buildIndex({ baseDir: config.rootDir })
        if (dev) {
          logger.info('building search index...', { timestamp: true })
          index = await searchPromise
          onIndexUpdated()
          searchPromise = undefined
        }
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
      if (dev)
        return `export const getSearchIndex = async () => ${JSON.stringify(JSON.stringify(index))}`

      if (searchPromise) {
        index = await searchPromise
        searchPromise = undefined
        hash = saveIndex(viteConfig?.build?.outDir!, index)
      } else if (!hash) {
        if (!viteConfig?.build?.ssr) hash = hash_(Date.now().toString(), 8)
        else hash = cache.search.get('hash')
      }

      cache.search.set('hash', hash)

      return `export const getSearchIndex = async () => JSON.stringify(await ((await fetch("${config.basePath}/.vocs/search-index-${hash}.json")).json()))`
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
          isPage: section.isPage,
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
