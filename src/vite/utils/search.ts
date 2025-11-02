import { readFileSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compile, run } from '@mdx-js/mdx'
import debug_ from 'debug'
import { default as fs } from 'fs-extra'
import MiniSearch from 'minisearch'
import pLimit from 'p-limit'
import { Fragment } from 'react'
import * as runtime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PluggableList } from 'unified'
import { matter } from 'vfile-matter'

import type { Frontmatter } from '../../app/types.js'
import { getRehypePlugins, getRemarkPlugins } from '../plugins/mdx.js'
import * as cache_ from './cache.js'
import { hash } from './hash.js'
import { slash } from './slash.js'

const limit = pLimit(30)

export const debug = debug_('vocs:search')

export async function buildIndex({ baseDir, cacheDir }: { baseDir: string; cacheDir?: string }) {
  const cache = cache_.search({ cacheDir })

  const pagesPaths = await Array.fromAsync(glob(`${resolve(baseDir, 'pages')}/**/*.{md,mdx}`))
  const rehypePlugins = getRehypePlugins({ cacheDir, rootDir: baseDir, twoslash: false })

  const documents = await Promise.all(
    pagesPaths.map((pagePath) =>
      limit(async (pagePath) => {
        const mdx = readFileSync(pagePath, 'utf-8')
        const key = `index.${hash(pagePath)}`
        const pageCache = cache.get(key) ?? {}
        if (pageCache.mdx === mdx) return pageCache.document

        // Temporary fix to include files with components in the search index until the todo in `processMdx()` is resolved
        const mdxNoImports = mdx.replace(/^(import|export).*/gm, '')
        const mdxNoComponents = mdxNoImports.replace(/<\/?\s*[A-Z][^>]*>/g, '')
        const { html, frontmatter } = await processMdx(pagePath, mdxNoComponents, { rehypePlugins })

        if (frontmatter.searchable === false) {
          cache.set(key, { mdx, document: [] })
          return []
        }

        const sections = splitPageIntoSections(html)
        if (sections.length === 0) {
          cache.set(key, { mdx, document: [] })
          return []
        }

        const fileId = getDocId(baseDir, pagePath)

        const relFile = slash(relative(baseDir, fileId))
        const href = relFile
          .replace(relative(baseDir, resolve(baseDir, 'pages')), '')
          .replace(/\.(md|mdx)$/, '')
          .replace(/\/index$/, '')

        const document = sections.map((section) => ({
          href: `${href}#${section.anchor}`,
          html: section.html,
          id: `${fileId}#${section.anchor}`,
          isPage: section.isPage,
          text: section.text,
          title: section.titles.at(-1)!,
          titles: section.titles.slice(0, -1),
        }))

        cache.set(key, { mdx, document })

        return document
      }, pagePath),
    ),
  )

  const index = new MiniSearch({
    fields: ['title', 'titles', 'text'],
    storeFields: ['href', 'html', 'isPage', 'text', 'title', 'titles'],
    // TODO
    // ...options.miniSearch?.options,
  })
  await index.addAllAsync(documents.flat())

  debug(`vocs:search > indexed ${pagesPaths.length} files`)

  return index
}

export function saveIndex(
  outDir: string,
  index: MiniSearch,
  { cacheDir }: { cacheDir?: string } = {},
) {
  const cache = cache_.search({ cacheDir })
  const json = index.toJSON()
  const hash_ = cache.get('hash') || hash(JSON.stringify(json), 8)
  const dir = join(outDir, '.vocs')
  fs.ensureDirSync(dir)
  fs.writeJSONSync(join(dir, `search-index-${hash_}.json`), json)
  return hash_
}

const remarkPlugins = getRemarkPlugins()

export async function processMdx(
  filePath: string,
  file: string,
  options: { rehypePlugins: PluggableList },
) {
  const { rehypePlugins } = options
  try {
    const compiled = await compile(file, {
      baseUrl: pathToFileURL(filePath).href,
      outputFormat: 'function-body',
      remarkPlugins: [...remarkPlugins, () => (_, file) => matter(file)],
      rehypePlugins,
    })
    const { default: MDXContent } = await run(compiled, { ...runtime, Fragment } as never)
    const html = renderToStaticMarkup(
      MDXContent({
        // TODO: Pass components - vanilla extract and virtual module errors
        // components,
      }),
    )
    return { html, frontmatter: compiled.data?.matter as Frontmatter }
  } catch (_error) {
    // TODO: Resolve imports (e.g. virtual modules)
    return { html: '', frontmatter: {} }
  }
}

export function getDocId(baseDir: string, file: string) {
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
  isPage: boolean
  text: string
  titles: string[]
}

export function splitPageIntoSections(html: string) {
  const result = html.split(headingRegex)
  result.shift()

  let parentTitles: string[] = []
  const sections: PageSection[] = []
  for (let i = 0; i < result.length; i += 3) {
    const level = Number.parseInt(result[i], 10) - 1
    const heading = result[i + 1]
    const headingResult = headingContentRegex.exec(heading)
    const title = clearHtmlTags(headingResult?.[1] ?? '').trim()
    const anchor = headingResult?.[2] ?? ''
    const content = result[i + 2]
    if (!title || !content) continue

    const titles = parentTitles.slice(0, level)
    titles[level] = title
    sections.push({
      anchor,
      html: content,
      isPage: i === 0,
      titles,
      text: getSearchableText(content),
    })

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
