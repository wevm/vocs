/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { default as fs } from 'fs-extra'
import { globbySync } from 'globby'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { createLogger } from 'vite'

import { resolveVocsConfig } from '../../utils/resolveVocsConfig.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const deadlinksPath = resolve(__dirname, '../../.vocs/cache/deadlinks.json')

const logger = createLogger('info')

if (fs.existsSync(deadlinksPath)) fs.removeSync(deadlinksPath)

export function remarkLinks() {
  const deadlinks = new Set<[string, string]>()

  return async (tree: Root, file: any) => {
    const { config } = await resolveVocsConfig()
    const { rootDir } = config

    visit(tree, 'link', (node) => {
      const filePath = file.history[0] as string | undefined
      if (!filePath) return

      const directory = dirname(filePath)

      const isExternalLink = !node.url.match(/^(\.*\/|#)/)
      if (isExternalLink) return

      // TODO: handle hash links
      if (node.url.startsWith('#')) return

      const [url, after] = (node.url || '').split('#')

      const [pagePath, baseDir] = (() => {
        if (url.startsWith('.')) return [resolve(directory, url), directory]
        return [resolve(rootDir, `./pages${url}`), resolve(rootDir, './pages')]
      })()

      const isFile = (() => {
        try {
          return fs.statSync(pagePath).isFile()
        } catch {
          return false
        }
      })()
      if (isFile) {
        node.url = parseLink(pagePath, baseDir)
        return
      }

      const [resolvedPagePath] = globbySync([
        `${pagePath}/index.{html,md,mdx,js,jsx,ts,tsx}`,
        `${pagePath}.{html,md,mdx,js,jsx,ts,tsx}`,
      ])
      if (!resolvedPagePath) {
        deadlinks.add([node.url, filePath])
        fs.ensureDirSync(resolve(__dirname, '../../.vocs/cache'))
        fs.writeFileSync(deadlinksPath, JSON.stringify([...deadlinks], null, 2))
        if (process.env.NODE_ENV === 'development')
          logger.warn(`could not resolve URL "${node.url}" in ${filePath}\n`, { timestamp: true })
        return
      }
      node.url = `${parseLink(resolvedPagePath, baseDir)}${after ? `#${after}` : ''}`
    })
  }
}

function parseLink(pagePath: string, baseDir: string) {
  return pagePath
    .replace(baseDir, '')
    .replace(/((index)?\.(html|md|mdx|js|jsx|ts|tsx))$/, '')
    .replace(/\/$/, '')
}
