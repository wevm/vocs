import * as fs from 'node:fs'
import * as path from 'node:path'
import GithubSlugger from 'github-slugger'
import type * as MdAst from 'mdast'
import { toString as mdastToString } from 'mdast-util-to-string'
import MiniSearch from 'minisearch'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import * as UnistUtil from 'unist-util-visit'
import * as yaml from 'yaml'
import type * as Config from './config.js'
import * as MarkdownImports from './markdown-imports.js'
import { extractSubheading, getPhrasingContentText, remarkStripInlineCache } from './mdx.js'
import * as OpenApiRegistry from './openapi/registry.js'
import * as OpenApiSearch from './openapi/search.js'
import * as Path from './path.js'
import { SearchConfig } from './search.client.js'
import * as Sidebar from './sidebar.js'
import * as TaskRunner from './task-runner.js'
import * as TopNav from './topNav.js'

export * from './search.client.js'

export namespace SearchDocuments {
  export type Document = {
    /** Category from topNav (e.g., "Extensions", "Docs") */
    category: string
    /** URL href (e.g., "/guide/intro#getting-started") */
    href: string
    /** Unique document ID (file path + anchor) */
    id: string
    /** Search priority (higher = more important, undefined = default) */
    searchPriority: number | undefined
    /** Subtitle from heading (e.g., "# Title [Subtitle]") */
    subtitle: string
    /** Searchable plain text content */
    text: string
    /** Section title (the heading text) */
    title: string
    /** Parent titles for breadcrumb context */
    titles: string[]
    /** Document type: 'page' | 'section' | 'nav' */
    type: 'page' | 'section' | 'nav'
  }

  /**
   * Build search documents from all MDX/MD pages in the pages directory.
   */
  export async function fromConfig(config: Config.Config): Promise<Document[]> {
    const pagesDirPath = path.resolve(config.rootDir, config.srcDir, config.pagesDir)
    const pages = await fs.promises.readdir(pagesDirPath, { recursive: true })
    const mdxPages = pages.filter((p) => p.endsWith('.md') || p.endsWith('.mdx'))

    const allDocuments: Document[] = []
    const taskRunner = TaskRunner.create(50)

    for (const page of mdxPages)
      taskRunner.run(async () => {
        const filePath = path.join(pagesDirPath, page)
        const rawContent = await fs.promises.readFile(filePath, 'utf-8')
        const content = MarkdownImports.inlineMarkdownImports(rawContent, filePath)

        const { searchPriority, sections } = extract(content, config)
        if (sections.length === 0) return

        const href =
          `/${page}`
            .replace(/\.(md|mdx)$/, '')
            .replace(/\/index$/, '')
            .replace(/^$/, '/') || '/'

        const category = findCategory(href, config.topNav)

        const documents = sections.map((section) => ({
          category,
          href: section.anchor ? `${href}#${section.anchor}` : href,
          id: `${filePath}#${section.anchor}`,
          searchPriority,
          subtitle: section.subtitle,
          text: section.text,
          title: section.title,
          titles: section.titles,
          type: section.isPage ? 'page' : 'section',
        })) satisfies Document[]

        allDocuments.push(...documents)
      })

    await taskRunner.wait()

    const externalLinks = extractExternalLinks(config)
    allDocuments.push(...externalLinks)

    const openapiDocuments = await fromOpenApi(config)
    allDocuments.push(...openapiDocuments)

    return allDocuments
  }

  /**
   * Builds search documents for every configured OpenAPI section from its parsed
   * IR, so the auto-generated reference is indexed alongside MDX pages. Failures
   * are swallowed so a broken/unreachable spec can't break the whole index.
   */
  async function fromOpenApi(config: Config.Config): Promise<Document[]> {
    if (!config.openapi || config.openapi.length === 0) return []
    try {
      const specs = await OpenApiRegistry.build(config)
      const documents = await Promise.all(
        Object.values(specs).map((ir) => OpenApiSearch.toSearchDocuments(ir)),
      )
      return documents.flat()
    } catch {
      return []
    }
  }

  export function extractExternalLinks(config: Config.Config): Document[] {
    const documents: Document[] = []
    const seenHrefs = new Set<string>()

    for (const item of TopNav.flatten(config.topNav)) {
      if (!Path.isExternal(item.link) || seenHrefs.has(item.link)) continue
      seenHrefs.add(item.link)
      documents.push({
        category: item.parent ?? '',
        href: item.link,
        id: `nav:topnav:${item.link}`,
        searchPriority: 2,
        subtitle: '',
        text: '',
        title: item.text,
        titles: item.parent ? [item.parent] : [],
        type: 'nav',
      })
    }

    if (config.sidebar) {
      const sidebarItems = Array.isArray(config.sidebar)
        ? config.sidebar
        : Object.values(config.sidebar).flatMap((value) =>
            Array.isArray(value) ? value : value.items,
          )

      for (const item of Sidebar.flatten(sidebarItems)) {
        if (!item.link || !Path.isExternal(item.link) || seenHrefs.has(item.link)) continue
        seenHrefs.add(item.link)
        documents.push({
          category: '',
          href: item.link,
          id: `nav:sidebar:${item.link}`,
          searchPriority: 2,
          subtitle: '',
          text: '',
          title: item.text ?? '',
          titles: [],
          type: 'nav',
        })
      }
    }

    return documents
  }

  /**
   * Find the topNav category text for a given href.
   * Returns the most specific match (longest match path).
   */
  export function findCategory(href: string, topNav: Config.Config['topNav']): string {
    if (!topNav) return ''

    let bestMatch: { text: string; depth: number } | undefined

    for (const item of topNav) {
      if ('items' in item && item.items) {
        for (const child of item.items) {
          const depth = getMatchDepth(href, child.match ?? child.link)
          if (depth !== undefined && (!bestMatch || depth > bestMatch.depth))
            bestMatch = { text: item.text, depth }
        }
      } else if ('link' in item) {
        const depth = getMatchDepth(href, item.match ?? item.link)
        if (depth !== undefined && (!bestMatch || depth > bestMatch.depth))
          bestMatch = { text: item.text, depth }
      }
    }
    return bestMatch?.text ?? ''
  }

  function getMatchDepth(
    href: string,
    match: string | ((path: string | undefined) => boolean) | undefined,
  ): number | undefined {
    if (!match) return undefined
    if (typeof match === 'function') return match(href) ? 0 : undefined
    const match_ = match.endsWith('/') ? match : `${match}/`
    const href_ = href.endsWith('/') ? href : `${href}/`
    if (href_.startsWith(match_) || href === match) return match.split('/').filter(Boolean).length
    return undefined
  }
}

export namespace SearchIndex {
  export type SearchIndex = MiniSearch<SearchDocuments.Document>

  /**
   * Create a search index from documents.
   */
  export function fromSearchDocuments(
    documents: SearchDocuments.Document[],
    config?: Config.Config,
  ): SearchIndex {
    const index = new MiniSearch<SearchDocuments.Document>(SearchConfig.getIndexOptions(config))
    index.addAll(documents)
    return index
  }

  /**
   * Load a search index from a JSON file.
   */
  export function loadFromFile(options: loadFromFile.Options): SearchIndex {
    const { config, filePath } = options

    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return MiniSearch.loadJSON(json, SearchConfig.getIndexOptions(config))
  }

  export declare namespace loadFromFile {
    type Options = {
      config?: Config.Config
      filePath: string
    }
  }

  /**
   * Update a single file in an existing index (for HMR).
   * Returns the new document IDs added.
   */
  export function updateFile(
    index: SearchIndex,
    filePath: string,
    options: updateFile.Options,
  ): string[] {
    const { pagesDir, previousIds = [], config } = options

    const rawContent = fs.readFileSync(filePath, 'utf-8')
    const content = MarkdownImports.inlineMarkdownImports(rawContent, filePath)
    const { searchPriority, sections } = extract(content, config)

    // Remove old entries for this file
    for (const id of previousIds) {
      if (index.has(id)) index.discard(id)
    }

    if (sections.length === 0) return []

    const relativePath = path.relative(pagesDir, filePath)
    const href = `/${relativePath}`
      .replace(/\.(md|mdx)$/, '')
      .replace(/\/index$/, '')
      .replace(/^\//, '/')

    const category = SearchDocuments.findCategory(href, config.topNav)
    const newIds: string[] = []

    for (const section of sections) {
      const id = `${filePath}#${section.anchor}`
      newIds.push(id)
      index.add({
        category,
        href: section.anchor ? `${href}#${section.anchor}` : href,
        id,
        searchPriority,
        subtitle: section.subtitle,
        text: section.text,
        title: section.title,
        titles: section.titles,
        type: section.isPage ? 'page' : 'section',
      })
    }

    return newIds
  }

  export declare namespace updateFile {
    type Options = {
      config: Config.Config
      pagesDir: string
      previousIds?: string[]
    }
  }
}

type Frontmatter = {
  searchPriority?: number
  [key: string]: unknown
}

type Section = {
  anchor: string
  isPage: boolean
  subtitle: string
  text: string
  title: string
  titles: string[]
}

/**
 * Extract frontmatter and sections from MDX content by parsing the MDAST.
 * Each heading starts a new section.
 *
 * - `content`: raw markdown (sliced from source) for rendering in search UI
 * - `text`: stripped plain text (directives/JSX removed) for search indexing
 */
export function extract(source: string, config: Config.Config): extract.ReturnType {
  const remarkPlugins = [
    remarkFrontmatter,
    remarkDirective,
    remarkGfm,
    remarkStripJsx,
    remarkStripDirectives,
    // Persisted twoslash cache comments are giant base64 blobs; without this
    // they leak into section text (and search snippets/embeddings).
    remarkStripInlineCache,
    // User plugins extend the parser (e.g. `remark-math`) so syntax
    // recognized in the React build also parses during indexing.
    ...(config.markdown?.remarkPlugins ?? []),
  ]

  // Extract frontmatter with regex (avoids extra parse)
  const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const frontmatter: Frontmatter = frontmatterMatch
    ? (yaml.parse(frontmatterMatch[1] ?? '') ?? {})
    : {}

  // Bail early if searchPriority is 0
  if (frontmatter.searchPriority === 0) return { searchPriority: 0, sections: [] }

  // Single parse for both positions and text extraction
  const processor = unified().use(remarkParse).use(remarkMdx).use(remarkPlugins)
  const tree = processor.parse(source)
  processor.runSync(tree)

  // Collect headings (plugins strip JSX/directives but preserve headings)
  const headingPositions = tree.children
    .filter((node): node is MdAst.Heading => node.type === 'heading')
    .map((heading) => {
      const subheading = extractSubheading(heading.children)
      const title = getPhrasingContentText(subheading?.headingChildren ?? heading.children).trim()
      const subtitle = subheading
        ? getPhrasingContentText(subheading.subheadingChildren).trim()
        : ''
      return {
        depth: heading.depth,
        endOffset: heading.position?.end.offset ?? 0,
        startOffset: heading.position?.start.offset ?? 0,
        subtitle,
        title,
      }
    })

  const slugger = new GithubSlugger()
  const sections: Section[] = []
  const titleStack: string[] = []

  let currentSection: Section | undefined
  let isFirstHeading = true

  function flushSection(): void {
    // Include section if it has text OR if it's the page title (first heading)
    if (currentSection?.text.trim() || currentSection?.isPage) sections.push(currentSection)
  }

  // Walk tree for text extraction (directives are unwrapped by runSync)
  let headingIndex = 0
  for (const node of tree.children) {
    if (node.type === 'heading') {
      const headingPos = headingPositions[headingIndex]
      if (headingPos) {
        flushSection()

        const depth = headingPos.depth
        const title = headingPos.title
        const anchor = slugger.slug(title)

        // Update title stack based on heading depth
        titleStack.length = depth - 1
        // Skipped heading levels leave holes; drop them from the breadcrumb.
        const titles = [...titleStack].filter((t) => t !== undefined)
        titleStack[depth - 1] = title

        currentSection = {
          anchor,
          isPage: isFirstHeading,
          subtitle: headingPos.subtitle,
          text: '',
          title,
          titles,
        }
        isFirstHeading = false
        headingIndex++
      }
      continue
    }

    // Accumulate text for current section
    if (currentSection) {
      const text = mdastToString(node)
      if (text) currentSection.text += ` ${text}`
    }
  }

  flushSection()

  // If page title has no text, use text from the first child section
  if (sections[0]?.isPage && !sections[0].text.trim() && sections[1]?.text.trim()) {
    sections[0].text = sections[1].text
  }

  return { searchPriority: frontmatter.searchPriority, sections }
}

export declare namespace extract {
  type ReturnType = {
    searchPriority: number | undefined
    sections: Section[]
  }
}

/**
 * String-valued JSX attributes worth indexing. Components like `<Card>` carry
 * their user-visible text in props (e.g. `title`, `description`) rather than
 * children, so a naive strip would drop it entirely from the search index.
 */
const indexedJsxAttributes = new Set(['title', 'description', 'label'])

/** Plain-text values of {@link indexedJsxAttributes} on a JSX element. */
function jsxAttributeText(node: MdAst.RootContent): string[] {
  if (!('attributes' in node) || !Array.isArray(node.attributes)) return []
  const values: string[] = []
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') continue
    if (!indexedJsxAttributes.has(attr.name)) continue
    if (typeof attr.value === 'string' && attr.value.trim()) values.push(attr.value.trim())
  }
  return values
}

function remarkStripJsx() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(
      tree,
      (node) =>
        node.type === 'mdxJsxFlowElement' ||
        node.type === 'mdxJsxTextElement' ||
        node.type === 'mdxjsEsm' ||
        node.type === 'mdxFlowExpression' ||
        node.type === 'mdxTextExpression',
      (node, index, parent) => {
        if (index === undefined || !parent) return
        // Preserve indexable attribute text (e.g. `<Card title description />`)
        // as a paragraph so it survives the strip and lands in the section text.
        const attrText = jsxAttributeText(node as MdAst.RootContent)
        const attrNode: MdAst.RootContent[] = attrText.length
          ? [{ type: 'paragraph', children: [{ type: 'text', value: attrText.join('. ') }] }]
          : []
        if ('children' in node && Array.isArray(node.children)) {
          parent.children.splice(index, 1, ...attrNode, ...(node.children as MdAst.RootContent[]))
          return index
        }
        parent.children.splice(index, 1, ...attrNode)
        return index
      },
    )
  }
}

function remarkStripDirectives() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(
      tree,
      (node) =>
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective',
      (node, index, parent) => {
        if (index === undefined || !parent) return
        if ('children' in node && Array.isArray(node.children)) {
          parent.children.splice(index, 1, ...(node.children as MdAst.RootContent[]))
          return index
        }
        parent.children.splice(index, 1)
        return index
      },
    )
  }
}
