/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import { globSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { default as fs } from 'fs-extra'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { createLogger } from 'vite'

import { resolveVocsConfig } from '../../utils/resolveVocsConfig.js'

const deadlinksPath = resolve(import.meta.dirname, '../../.vocs/cache/deadlinks.json')

const logger = createLogger('info')

export function remarkLinks() {
  const deadlinks = new Set<[string, string]>()

  return async (tree: Root, file: any) => {
    const { config } = await resolveVocsConfig()
    const { checkDeadlinks, rootDir } = config

    const processLink = (node: any, filePath: string) => {
      const directory = dirname(filePath)

      const isExternalLink = !node.url.match(/^(\.*\/|#)/)
      if (isExternalLink) return

      // TODO: handle hash links
      if (node.url.startsWith('#')) return

      const [url, after] = (node.url || '').split('#')

      const baseDir = resolve(rootDir, './pages')
      const pagePath = url.startsWith('.')
        ? resolve(directory, url)
        : resolve(rootDir, `./pages${url}`)

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

      const [resolvedPagePath] = [
        ...globSync(`${pagePath}/index.{html,md,mdx,js,jsx,ts,tsx}`),
        ...globSync(`${pagePath}.{html,md,mdx,js,jsx,ts,tsx}`),
      ]
      if (!resolvedPagePath) {
        if (checkDeadlinks !== false) {
          deadlinks.add([node.url, filePath])
          fs.ensureDirSync(resolve(import.meta.dirname, '../../.vocs/cache'))
          fs.writeFileSync(deadlinksPath, JSON.stringify([...deadlinks], null, 2))
        }
        if (process.env.NODE_ENV === 'development')
          logger.warn(`could not resolve URL "${node.url}" in ${filePath}\n`, { timestamp: true })
        return
      }
      node.url = `${parseLink(resolvedPagePath, baseDir)}${after ? `#${after}` : ''}`
    }

    // Handle inline links: [text](url)
    visit(tree, 'link', (node) => {
      const filePath = file.history[0] as string | undefined
      if (!filePath) return
      processLink(node, filePath)
    })

    // Handle reference-style links: [text][ref] or [text] with [ref]: url
    visit(tree, 'definition', (node) => {
      const filePath = file.history[0] as string | undefined
      if (!filePath) return
      processLink(node, filePath)
    })
  }
}

function parseLink(pagePath: string, baseDir: string) {
  return pagePath
    .replace(baseDir, '')
    .replace(/((index)?\.(html|md|mdx|js|jsx|ts|tsx))$/, '')
    .replace(/\/$/, '')
}
