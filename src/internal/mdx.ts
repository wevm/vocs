import * as fs from 'node:fs'
import * as path from 'node:path'
import type { CompileOptions } from '@mdx-js/mdx'
import shiki, { type RehypeShikiOptions } from '@shikijs/rehype'
import * as EstreeUtil from 'esast-util-from-js'
import type * as Estree from 'estree'
import type * as HAst from 'hast'
import type * as MdAst from 'mdast'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkParse from 'remark-parse'
import type {
  BuiltinTheme,
  CodeOptionsMultipleThemes,
  LanguageRegistration,
  ShikiTransformer,
} from 'shiki'
import { bundledLanguages } from 'shiki/bundle/web'
import dockerfile from 'shiki/langs/dockerfile.mjs'
import go from 'shiki/langs/go.mjs'
import protobuf from 'shiki/langs/protobuf.mjs'
import python from 'shiki/langs/python.mjs'
import rust from 'shiki/langs/rust.mjs'
import solidity from 'shiki/langs/solidity.mjs'
import sql from 'shiki/langs/sql.mjs'
import toml from 'shiki/langs/toml.mjs'
import yamlLang from 'shiki/langs/yaml.mjs'
import { type Pluggable, type PluggableList, type Processor, unified } from 'unified'
import * as UnistUtil from 'unist-util-visit'
import type { VFile } from 'vfile'
import { createLogger } from 'vite'
import * as yaml from 'yaml'
import * as Changelog from './changelog.js'
import type * as Config from './config.js'
import * as Git from './git.js'
import * as Icons from './icons.js'
import * as OpenApiRegistry from './openapi/registry.js'
import { rehypeImageSize } from './rehype-image-size.js'
import { remarkVocsScope } from './remark-vocs-scope.js'
import { remarkSandbox } from './sandbox.js'
import * as ShikiTransformers from './shiki-transformers.js'
import * as Snippets from './snippets.js'
import * as InlineCache from './twoslash/inline-cache.js'
import type { ExactPartial, UnionOmit } from './types.js'

export { default as remarkFrontmatter } from 'remark-frontmatter'
export { default as remarkMdxFrontmatter } from 'remark-mdx-frontmatter'

const defaultLanguages = {
  ...bundledLanguages,
  dockerfile,
  go,
  protobuf,
  python,
  rust,
  solidity,
  sql,
  toml,
  yaml: yamlLang,
} as const

/** Set of all valid language names including aliases from explicitly imported languages */
const validLanguageNames = new Set([
  ...Object.keys(bundledLanguages),
  // Extract names and aliases from explicitly imported language modules (non-function values)
  ...Object.values(defaultLanguages).flatMap((lang) =>
    typeof lang === 'function' ? [] : lang.flatMap((l) => [l.name, ...(l.aliases ?? [])]),
  ),
])

function getLanguageNames(langs: readonly unknown[] | undefined): string[] {
  if (!langs) return []

  return langs.flatMap((lang) => {
    if (Array.isArray(lang)) return getLanguageNames(lang)
    if (typeof lang === 'string') return [lang]
    if (!lang || typeof lang !== 'object') return []
    if ('default' in lang) {
      const defaultLangs = lang.default
      return getLanguageNames(Array.isArray(defaultLangs) ? defaultLangs : [defaultLangs])
    }
    if (!('name' in lang)) return []

    const { aliases, name } = lang as LanguageRegistration
    return name ? [name, ...(aliases ?? [])] : (aliases ?? [])
  })
}

/**
 * Remark plugin that transforms mermaid code blocks into Mermaid components.
 * Replaces ```mermaid code blocks with a paragraph that has hName/hProperties
 * to become a div with data-v-mermaid-chart attribute.
 */
export function remarkMermaid(): remarkMermaid.ReturnType {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, 'code', (node, index, parent) => {
      if (index === undefined || !parent) return
      if (node.lang !== 'mermaid') return

      const chart = node.value.trim()

      // Replace the code node with a paragraph that transforms to a div
      const replacement = {
        type: 'paragraph',
        children: [],
        data: {
          hName: 'div',
          hProperties: {
            'data-v-mermaid-chart': chart,
          },
        },
      } satisfies MdAst.Paragraph

      parent.children.splice(index, 1, replacement)
      return UnistUtil.SKIP
    })
  }
}

export declare namespace remarkMermaid {
  type ReturnType = (tree: MdAst.Root) => void
}

/** Masks prompt bodies during parsing so MDX syntax remains literal prompt text. */
function maskPromptBodies(markdown: string): string {
  let codeFence: string | undefined
  let promptFenceSize = 0

  return markdown
    .split(/(?<=\n)/)
    .map((line) => {
      const value = line.replace(/\r?\n$/, '')

      if (promptFenceSize) {
        const closing = value.match(/^ {0,3}(:{3,})[ \t]*$/)?.[1]
        if (closing && closing.length >= promptFenceSize) {
          promptFenceSize = 0
          return line
        }
        return line.replace(/[^\r\n]/g, 'x')
      }

      if (codeFence) {
        const closing = value.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/)?.[1]
        if (closing && closing[0] === codeFence[0] && closing.length >= codeFence.length)
          codeFence = undefined
        return line
      }

      const nextCodeFence = value.match(/^ {0,3}(`{3,}|~{3,})/)?.[1]
      if (nextCodeFence) {
        const info = value.slice(value.indexOf(nextCodeFence) + nextCodeFence.length)
        if (nextCodeFence[0] === '~' || !info.includes('`')) codeFence = nextCodeFence
        return line
      }

      const promptFence = value.match(/^ {0,3}(:{3,})prompt[ \t]*$/)?.[1]
      if (promptFence) promptFenceSize = promptFence.length
      return line
    })
    .join('')
}

/** Transforms prompt directives into prompt blocks. */
export function remarkPrompt(
  this: Processor,
  options: remarkPrompt.Options = {},
): remarkPrompt.ReturnType {
  const parser = this.parser
  if (!parser) throw new Error('`remarkPrompt` requires a parser')
  this.parser = (document, file) => parser(maskPromptBodies(document), file)

  return (tree: MdAst.Root, file: VFile) => {
    const raw = typeof file.value === 'string' ? file.value : file.value?.toString()
    if (!raw) return

    UnistUtil.visit(tree, (node, index, parent) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'prompt') return
      if (index === undefined || !parent) return

      const start = node.position?.start.offset
      const end = node.position?.end.offset
      if (start === undefined || end === undefined) return

      const source = raw.slice(start, end)
      const bodyStart = source.indexOf('\n')
      if (bodyStart === -1) return

      const closingStart = source.lastIndexOf('\n')
      const closingLine = source.slice(closingStart + 1).replace(/\r$/, '')
      const bodyEnd = /^[ \t]*:{3,}[ \t]*$/.test(closingLine) ? closingStart : source.length
      const value = source.slice(bodyStart + 1, bodyEnd)

      const replacement =
        options.output === 'code'
          ? ({ type: 'code', lang: 'prompt', value } satisfies MdAst.Code)
          : ({
              type: 'paragraph',
              children: [],
              data: {
                hName: 'pre',
                hProperties: {
                  'data-v-prompt': value,
                },
              },
            } satisfies MdAst.Paragraph)

      parent.children.splice(index, 1, replacement)
      return UnistUtil.SKIP
    })
  }
}

export declare namespace remarkPrompt {
  type Options = {
    output?: 'code' | 'element' | undefined
  }
  type ReturnType = (tree: MdAst.Root, file: VFile) => void
}

/**
 * Remark plugin that injects an ephemeral source-map comment into the body of
 * each `twoslash` code block. The comment carries the block's source position
 * (`{ path, from, to }`) so the inline types cache knows where to write the
 * `// @twoslash-cache: ...` comment back to.
 *
 * The injected comment is stripped again by the `extractInlineCacheSourceMap`
 * shiki transformer before twoslash/shiki run, so it never reaches the output
 * or the on-disk file.
 *
 * Only top-level (non-indented) fences are supported, which covers the
 * overwhelming majority of twoslash blocks.
 */
export function remarkInlineCache(): remarkInlineCache.ReturnType {
  return (tree: MdAst.Root, file: VFile) => {
    const raw = typeof file.value === 'string' ? file.value : file.value?.toString()
    const filePath = file.path
    if (!raw || !filePath) return

    UnistUtil.visit(tree, 'code', (node) => {
      if (!node.meta?.includes('twoslash')) return

      const start = node.position?.start
      const end = node.position?.end
      if (start?.offset == null || end?.offset == null) return
      // Only top-level fences (not nested in lists/blockquotes) are supported.
      if (start.column !== 1) return

      const newlineIndex = raw.indexOf('\n', start.offset)
      if (newlineIndex === -1) return
      const bodyStart = newlineIndex + 1

      node.value = InlineCache.injectSourceMapComment(node.value, {
        path: filePath,
        from: bodyStart,
        to: end.offset,
      })
    })
  }
}

export declare namespace remarkInlineCache {
  type ReturnType = (tree: MdAst.Root, file: VFile) => void
}

const extensions = ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.md', '.mdx']
const logger = createLogger(undefined, { allowClearScreen: false, prefix: '[vocs]' })

/** Collection of dead links across files. */
export const deadLinks = new Map<string, string[]>()

export function getCompileOptions(
  type: 'txt' | 'react',
  config: Config.Config,
): Omit<CompileOptions, 'remarkPlugins' | 'rehypePlugins' | 'recmaPlugins'> & {
  remarkPlugins: PluggableList
  rehypePlugins: PluggableList
  recmaPlugins: PluggableList
} {
  const { cacheDir, codeHighlight, markdown, rootDir, srcDir, twoslash } = config
  const { jsxImportSource = 'react' } = markdown ?? {}

  // Extract language names from twoslash transformers (e.g., rust, toml from experimental_rust)
  const twoslashTransformerLangs =
    twoslash && typeof twoslash === 'object' && twoslash.transformers
      ? twoslash.transformers.flatMap((t) =>
          'langs' in t
            ? (t.langs as { name?: string; id?: string }[]).flatMap((l) => {
                const names = [l.name, l.id].filter(Boolean) as string[]
                return names
              })
            : [],
        )
      : []
  const codeHighlightLanguageNames = getLanguageNames(codeHighlight.langs)
  const additionalLanguageNames = Array.from(
    new Set([...twoslashTransformerLangs, ...codeHighlightLanguageNames]),
  )

  const { recmaPlugins, rehypePlugins, remarkPlugins } = (() => {
    if (type === 'txt')
      return {
        recmaPlugins: [],
        rehypePlugins: [],
        remarkPlugins: [
          remarkFrontmatter,
          remarkDefaultFrontmatter,
          remarkExtractFrontmatter,
          remarkStripFrontmatter,
          remarkStripJs,
          remarkStripInlineCache,
          // Parse directive syntax (`::name`/`:::name`) so data-backed
          // directives can render real markdown below. Unhandled directives
          // round-trip back to their source form on stringify.
          remarkDirective,
          [remarkPrompt, { output: 'code' }] as Pluggable,
          [remarkChangelogMarkdown, config] as Pluggable,
          // User plugins extend the parser (e.g. `remark-math`) so syntax
          // recognized in the React build also parses for llms/search.
          ...(markdown?.remarkPlugins ?? []),
        ],
      }
    if (type === 'react')
      return {
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append' as const,
              test: ['h2', 'h3', 'h4', 'h5', 'h6'],
              properties: {
                ariaLabel: 'Copy link and go to this section',
                className: ['heading-anchor'],
                title: 'Copy link and go to this section',
              },
              // TODO: use iconify icon data instead of hardcoded paths
              content: {
                type: 'element' as const,
                tagName: 'svg',
                properties: {
                  className: ['heading-anchor-icon'],
                  xmlns: 'http://www.w3.org/2000/svg',
                  width: '0.75em',
                  height: '0.75em',
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: '2',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                },
                children: [
                  {
                    type: 'element' as const,
                    tagName: 'path',
                    properties: {
                      d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
                    },
                    children: [],
                  },
                  {
                    type: 'element' as const,
                    tagName: 'path',
                    properties: {
                      d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
                    },
                    children: [],
                  },
                ],
              },
            },
          ] as Pluggable,
          rehypeHeadingAnchors(config),
          rehypeShiki({ ...codeHighlight, cacheDir, rootDir, srcDir, twoslash }),
          ...(markdown?.rehypePlugins ?? []),
          rehypeCodeInLink,
          rehypeImageSize(config),
          rehypeLinks(config),
        ],
        remarkPlugins: [
          remarkMermaid,
          remarkFrontmatter,
          remarkDirective,
          [remarkFileTree, config] as Pluggable,
          remarkCallout,
          remarkChangelog,
          remarkCodeGroup,
          remarkPrompt,
          remarkLangCommaAttrs,
          [remarkCodeTitle, { additionalLanguages: additionalLanguageNames }] as Pluggable,
          remarkDefaultFrontmatter,
          remarkDetails,
          remarkBadge,
          remarkFilename,
          remarkGfm,
          remarkMetaFrontmatter,
          remarkMdxFrontmatter,
          remarkSandbox,
          remarkSteps,
          remarkTerminal,
          remarkSubheading,
          remarkVocsScope,
          ...(markdown?.remarkPlugins ?? []),
          // Runs after snippet/include processing so the injected source-map
          // comment doesn't interfere with snippet detection.
          ...(twoslash && typeof twoslash === 'object' && InlineCache.enabled(twoslash.inlineCache)
            ? [remarkInlineCache]
            : []),
          remarkRestoreUnknownTextDirectives,
        ],
        recmaPlugins: [recmaMdxLayout(config), ...(markdown?.recmaPlugins ?? [])],
      }
    throw new Error(`Invalid type: ${type}`)
  })()

  return {
    ...markdown,
    jsxImportSource,
    providerImportSource: 'vocs/mdx',
    recmaPlugins,
    rehypePlugins,
    remarkPlugins,
  }
}

/**
 * Recma plugin that wraps the MDX default export with MdxLayout.
 * This gives the layout access to frontmatter and path props.
 */
export function recmaMdxLayout(config: Config.Config) {
  const { rootDir, srcDir, pagesDir } = config
  const pagesDirPath = path.resolve(rootDir, srcDir, pagesDir)

  const layoutPaths = new Map<string, string>()

  return () => (tree: Estree.Program, vfile: VFile) => {
    const fileName = vfile.basename ?? ''
    if (!fileName.endsWith('.mdx') && !fileName.endsWith('.md')) return
    if (!vfile.path) return

    const sourcePath = path.resolve(vfile.path)
    const filePath = path.relative(pagesDirPath, sourcePath)
    if (filePath.startsWith('..') || path.isAbsolute(filePath)) return

    const defaultExportIndex = tree.body.findIndex(
      (node) => node.type === 'ExportDefaultDeclaration',
    )
    if (defaultExportIndex === -1) return

    function getMdxLayoutImport(dir: string) {
      if (dir === path.dirname(pagesDirPath)) return `import { Layout as _Layout } from 'vocs';`
      if (layoutPaths.has(dir)) return `import _Layout from '${layoutPaths.get(dir)}';`
      const layoutPath = path.join(dir, '_mdx-wrapper.tsx')
      const layoutFile = fs.existsSync(layoutPath)
      if (!layoutFile) return getMdxLayoutImport(path.dirname(dir))
      layoutPaths.set(dir, layoutPath)
      return `import _Layout from '${layoutPath}';`
    }

    const lastModified = Git.getLastModified(sourcePath)

    const importAst = EstreeUtil.fromJs(
      `import { MdxPageContext as _MdxPageContext } from 'vocs';
       import { createElement as _createElement } from 'react';
       ${getMdxLayoutImport(vfile.dirname ?? pagesDirPath)}`,
      { module: true },
    )
    tree.body.unshift(...importAst.body)

    const wrapperAst = EstreeUtil.fromJs(
      `export function Page(props = {}) {
        const _frontmatter = { 
          ...frontmatter, 
          filePath: "${filePath}",
          lastModified: ${lastModified ? `"${lastModified}"` : 'undefined'},
        };
        return _createElement(
          _MdxPageContext.Provider, 
          { frontmatter: _frontmatter }, 
          _createElement(
            _Layout,
            null,
            _createElement(MDXContent, props)
          )
        );
      }`,
      { module: true },
    )

    // Add the wrapper export
    tree.body.push(...wrapperAst.body)
  }
}

/**
 * Rehype plugin that inverts `<a><code>` to `<code><a>`.
 * This allows styling inline code links more naturally.
 */
export function rehypeCodeInLink() {
  return (tree: HAst.Root) => {
    UnistUtil.visit(tree, 'element', (node) => {
      const element = node as HAst.Element
      if (element.tagName !== 'a') return
      if (element.children.length !== 1) return

      const child = element.children[0]
      if (!child || child.type !== 'element' || child.tagName !== 'code') return

      const codeProps = child.properties
      const linkProps = element.properties
      const codeChildren = child.children

      element.tagName = 'code'
      element.properties = codeProps
      element.children = [
        {
          type: 'element',
          tagName: 'a',
          properties: linkProps,
          children: codeChildren,
        },
      ]
    })
  }
}

/**
 * Rehype plugin that resolves hash-only heading anchor hrefs against the page path.
 * A hash-only href resolves against the `<base>` tag and navigates to the site root
 * when `baseUrl` is set.
 */
export function rehypeHeadingAnchors(config: Config.Config) {
  const { rootDir, srcDir, pagesDir } = config
  const pagesDirPath = path.resolve(rootDir, srcDir, pagesDir)

  return () => (tree: HAst.Root, vfile: VFile) => {
    if (!vfile.path) return

    const relativePath = path.relative(pagesDirPath, path.resolve(vfile.path))
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return
    // Dynamic segments only resolve at request time; leave those to the runtime `Link`.
    if (relativePath.includes('[')) return

    const pagePath =
      `/${relativePath.split(path.sep).join('/')}`
        .replace(/\.(md|mdx)$/, '')
        .replace(/\/index$/, '') || '/'

    UnistUtil.visit(tree, 'element', (node) => {
      const element = node as HAst.Element
      if (element.tagName !== 'a') return

      const className = element.properties?.['className']
      const classes = Array.isArray(className) ? className : [className]
      if (!classes.includes('heading-anchor')) return

      const href = element.properties?.['href']
      if (typeof href !== 'string' || !href.startsWith('#')) return

      element.properties['href'] = `${pagePath}${href}`
    })
  }
}

/**
 * Rehype plugin that processes links:
 * - Strips .mdx and .md extensions from hrefs
 * - Strips trailing /index from hrefs
 * - Marks dead internal links with data-v-dead-link attribute
 * - Collects dead links for reporting at build end
 */
export function rehypeLinks(config: Config.Config) {
  const { checkDeadlinks, rootDir, srcDir, pagesDir } = config
  const pagesDirPath = path.join(rootDir, srcDir, pagesDir)

  return () => (tree: HAst.Root, vfile: VFile) => {
    const links: string[] = []

    // OpenAPI specs generate routes (the mount overview and one page per
    // category group) that have no backing file in `pages/`, so links to them
    // would otherwise be flagged as dead. Collect the valid routes from the
    // parsed specs to allow them through.
    const openapiRoutes = new Set<string>()
    const specs = OpenApiRegistry.peek()
    if (specs)
      for (const [mount, ir] of Object.entries(specs)) {
        const base = mount === '/' ? '' : mount.replace(/\/$/, '')
        openapiRoutes.add(base || '/')
        for (const group of ir.groups) openapiRoutes.add(`${base}/${group.id}`)
      }

    UnistUtil.visit(tree, 'element', (node) => {
      const element = node as HAst.Element
      if (element.tagName !== 'a') return

      const href = element.properties?.['href']
      if (typeof href !== 'string') return

      // Skip external links and hash-only links
      if (href.match(/^(https?:\/\/|mailto:|tel:|#)/)) return

      // Skip URL-encoded backtick paths (e.g., %60Context%60 from Rust Twoslash type hints)
      if (href.includes('%60')) return

      // Check if link has .md/.mdx extension to process
      const hasExtension = extensions.some((ext) => href.endsWith(ext))

      // Strip extension and /index
      if (hasExtension) {
        const extPattern = extensions.map((ext) => ext.slice(1)).join('|')
        const cleanHref = href
          .replace(new RegExp(`\\.(${extPattern})$`), '') // remove extension
          .replace(/\/index$/, '') // remove /index
        element.properties['href'] = cleanHref
      }

      // Check if internal link exists in filesystem
      const currentDir = vfile.dirname ?? pagesDirPath
      const [linkPath] = href.split('#')
      // For absolute paths (starting with /), resolve from pagesDirPath
      // For relative paths, resolve from current file's directory
      const resolvedPath = linkPath?.startsWith('/')
        ? path.join(pagesDirPath, linkPath)
        : path.resolve(currentDir, linkPath ?? '')

      // Allow OpenAPI-generated routes (no backing file) by matching the link's
      // absolute path against the routes collected from the parsed specs.
      const isOpenapiRoute =
        linkPath?.startsWith('/') && openapiRoutes.has(linkPath.replace(/\/$/, '') || '/')

      // Check for file existence (try with extensions if not present)
      const exists =
        isOpenapiRoute ||
        fs.existsSync(resolvedPath) ||
        extensions.some((ext) => fs.existsSync(`${resolvedPath}${ext}`)) ||
        extensions.some((ext) => fs.existsSync(`${resolvedPath}/index${ext}`))

      // Allow /TODO links but still style them with squiggly underline
      const isTodoLink = linkPath === '/TODO'
      if (isTodoLink) {
        element.properties['data-v-dead-link'] = ''
        if (checkDeadlinks !== false) {
          logger.warn(`TODO link in "/${path.relative(pagesDirPath, vfile.path)}": "${href}"`, {
            timestamp: true,
          })
        }
        return
      }

      if (!exists && checkDeadlinks !== false) {
        element.properties['data-v-dead-link'] = ''
        logger.error(
          `detected dead link in "/${path.relative(pagesDirPath, vfile.path)}": "${href}"`,
          {
            timestamp: true,
          },
        )
        links.push(href)
      }
    })

    if (links.length > 0) {
      const file = vfile.path ?? 'unknown'
      deadLinks.set(file, links)
    }
  }
}

// Re-export from separate module to avoid importing vite in runtime contexts
export { remarkVocsScope } from './remark-vocs-scope.js'

/**
 * Rehype plugin that processes code blocks with Shiki.
 */
export function rehypeShiki(
  options: ExactPartial<rehypeShiki.Options> = {},
): [typeof shiki, RehypeShikiOptions] {
  const { cacheDir, langs: userLangs, srcDir, rootDir, themes, twoslash = true } = options

  // Process twoslash transformers - inject cacheDir if they're factory functions
  const rawTransformers =
    twoslash && typeof twoslash === 'object' ? twoslash.transformers : undefined
  const twoslashTransformers = rawTransformers?.map((t) =>
    typeof t === 'function' ? t({ cacheDir }) : t,
  )

  // Extract langs from transformers that provide them (e.g., experimental_rust)
  const transformerLangs =
    rawTransformers?.flatMap((t) => ('langs' in t ? (t.langs as LanguageRegistration[]) : [])) ?? []

  // Merge default languages with user-provided languages and transformer languages
  const mergedLangs = [
    ...Object.values(defaultLanguages),
    ...(userLangs ?? []),
    ...transformerLangs,
  ]

  return [
    shiki,
    {
      ...(options ?? {}),
      defaultColor: 'light-dark()',
      fallbackLanguage: 'plaintext',
      inline: 'tailing-curly-colon',
      rootStyle: false,
      themes,
      langs: mergedLangs,
      // TODO: infer `langs` for faster cold start.
      transformers: [
        // Must run before the twoslash transformer so `this.meta.sourceMap` is
        // available to the inline types cache.
        twoslash && typeof twoslash === 'object' && InlineCache.enabled(twoslash.inlineCache)
          ? ShikiTransformers.extractInlineCacheSourceMap()
          : undefined,
        rootDir && srcDir ? ShikiTransformers.notationInclude({ srcDir, rootDir }) : undefined,
        twoslash
          ? ShikiTransformers.twoslash({
              ...(typeof twoslash === 'object' ? twoslash : {}),
              cacheDir,
            })
          : undefined,
        ...(twoslashTransformers ?? []),
        ShikiTransformers.shellNotation(),
        ShikiTransformers.emptyLine(),
        ShikiTransformers.customTag(),
        ShikiTransformers.lineNumbers(),
        ShikiTransformers.notationBlock(),
        ShikiTransformers.notationDiff(),
        ShikiTransformers.notationFocus(),
        ShikiTransformers.notationHighlight(),
        ShikiTransformers.notationWordHighlight(),
        ...ShikiTransformers.notationCollapse(),
        ...ShikiTransformers.notationFold(),
        ShikiTransformers.showWrap(),
        ShikiTransformers.removeNotationEscape(),
        ShikiTransformers.shellPrompt(options.shellPrompt),
        ShikiTransformers.tagLine(),
        ShikiTransformers.title(),
        ShikiTransformers.inlineLanguage(),
        ...(options.transformers ?? []),
      ].filter(Boolean),
    } as RehypeShikiOptions,
  ]
}

export declare namespace rehypeShiki {
  export type Options = UnionOmit<ExactPartial<RehypeShikiOptions>, 'inline' | 'rootStyle'> &
    UnionOmit<CodeOptionsMultipleThemes<BuiltinTheme>, 'defaultColor'> & {
      cacheDir?: string | undefined
      rootDir?: string | undefined
      shellPrompt?: ShikiTransformers.shellPrompt.Options | undefined
      srcDir?: string | undefined
      twoslash?:
        | (ShikiTransformers.twoslash.Options & {
            /** Additional twoslash transformers (e.g., `Twoslash.experimental_rust()`). */
            transformers?:
              | (
                  | ShikiTransformer
                  | ((options: { cacheDir?: string | undefined }) => ShikiTransformer)
                )[]
              | undefined
          })
        | false
        | undefined
    }
}

export function remarkCallout() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (
        node.name !== 'callout' &&
        node.name !== 'info' &&
        node.name !== 'warning' &&
        node.name !== 'danger' &&
        node.name !== 'tip' &&
        node.name !== 'success' &&
        node.name !== 'note'
      )
        return

      // @ts-expect-error
      const label = node.children.find((child) => child.data?.directiveLabel)?.children[0].value

      // biome-ignore lint/suspicious/noAssignInExpressions: _
      const data = node.data || (node.data = {})
      const tagName = 'aside'

      if (label) {
        // biome-ignore lint/suspicious/noExplicitAny: _
        node.children = node.children.filter((child: any) => !child.data?.directiveLabel)
        node.children.unshift({
          type: 'paragraph',
          data: { hProperties: { 'data-v-callout-title': true } },
          children: [
            {
              type: 'strong',
              children: [{ type: 'text', value: label }],
            },
          ],
        })
      }

      data.hName = tagName
      data.hProperties = {
        ...(node.attributes ?? {}),
        'data-v-callout': true,
        'data-v-context': node.name !== 'callout' ? node.name : 'info',
      }
    })
  }
}

/**
 * Remark plugin that transforms `:badge[content]{variant}` text directives into Badge elements.
 *
 * Syntax:
 * - `:badge[Beta]` – renders a Badge with default "info" variant
 * - `:badge[New]{success}` – renders a Badge with "success" variant
 * - `:badge[Deprecated]{warning}` – renders a Badge with "warning" variant
 */
export function remarkBadge(): remarkBadge.ReturnType {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, 'textDirective', (node) => {
      if (node.name !== 'badge') return

      // biome-ignore lint/suspicious/noAssignInExpressions: _
      const data = node.data || (node.data = {})

      // Extract variant from attributes (e.g., {warning} becomes { warning: '' })
      const variant = node.attributes ? Object.keys(node.attributes)[0] : undefined

      data.hName = 'span'
      data.hProperties = {
        'data-v-badge': '',
        'data-v-context': variant ?? 'info',
      }
    })
  }
}

export declare namespace remarkBadge {
  type ReturnType = (tree: MdAst.Root) => void
}

/**
 * Remark plugin that restores unhandled text directives back to their original Markdown.
 * This keeps text like `localhost:3003` inside link labels from becoming empty JSX elements.
 */
export function remarkRestoreUnknownTextDirectives() {
  return (tree: MdAst.Root, file: VFile) => {
    UnistUtil.visit(tree, 'textDirective', (node, index, parent) => {
      if (index === undefined || !parent) return
      if (node.data?.hName) return

      parent.children.splice(index, 1, {
        type: 'text',
        value: getSourceText(file, node) ?? `:${node.name}`,
      })
    })
  }
}

function getSourceText(file: VFile, node: MdAst.Nodes) {
  const source = String(file.value ?? '')
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) return undefined
  return source.slice(start, end)
}

/**
 * Remark plugin that normalizes comma-separated language attributes.
 * Some doc systems use syntax like `rust,no_run` or `python,ignore` where
 * attributes after the comma are directives, not separate languages.
 * This plugin splits on comma, uses the first part as lang, and moves the rest to meta.
 */
export function remarkLangCommaAttrs() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, 'code', (node) => {
      if (!node.lang?.includes(',')) return
      const [lang, ...attrs] = node.lang.split(',')
      const existingMeta = node.meta ? `${node.meta} ` : ''
      node.meta = `${existingMeta}${attrs.join(' ')}`
      node.lang = lang
    })
  }
}

/**
 * Remark plugin that normalizes code block titles.
 * When no lang is specified (e.g., ``` [Title]), the bracket syntax
 * may be parsed as the lang. This moves it to meta instead.
 */
export function remarkCodeTitle(options: remarkCodeTitle.Options = {}) {
  const specialLanguages = new Set(['ansi', 'text', 'txt', 'plain', 'plaintext'])
  const additionalLanguages = new Set(options.additionalLanguages ?? [])
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, 'code', (node) => {
      if (!node.lang) return
      const match =
        validLanguageNames.has(node.lang) ||
        specialLanguages.has(node.lang) ||
        additionalLanguages.has(node.lang)
      if (match) return
      node.meta = node.lang
      node.lang = 'plaintext'
    })
  }
}

export declare namespace remarkCodeTitle {
  type Options = {
    additionalLanguages?: string[] | undefined
  }
}

export function remarkCodeGroup() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'code-group') return

      // biome-ignore lint/suspicious/noAssignInExpressions: _
      const data = node.data || (node.data = {})
      const tagName = 'div'

      node.attributes = {
        ...node.attributes,
        'data-v-code-group': '',
      }

      data.hName = tagName
      data.hProperties = node.attributes || {}

      node.children = node.children
        .map((child) => {
          if (child.type !== 'code') return child
          const match = 'meta' in child && child?.meta?.match(/\[(.*)\]/)
          return {
            type: 'paragraph',
            children: [child],
            data: {
              hName: 'div',
              hProperties: match
                ? {
                    'data-v-code-group-item': '',
                    'data-title': match[1],
                  }
                : undefined,
            },
          }
        })
        .filter(Boolean) as (MdAst.BlockContent | MdAst.DefinitionContent)[]
    })
  }
}

/**
 * Remark plugin that extracts frontmatter attributes from the document.
 */
export function remarkDefaultFrontmatter() {
  return (tree: MdAst.Root) => {
    // Find existing frontmatter
    const frontmatterNode = tree.children.find((node) => node.type === 'yaml') as
      | { type: 'yaml'; value: string }
      | undefined
    const existingFrontmatter = frontmatterNode?.value ?? ''
    const hasTitle = /^title:/m.test(existingFrontmatter)
    const hasDescription = /^description:/m.test(existingFrontmatter)

    if (hasTitle && hasDescription) return

    // Find first heading (prefer h1, fall back to first heading of any depth)
    const heading = (tree.children.find(
      (node) => node.type === 'heading' && (node as { depth: number }).depth === 1,
    ) ?? tree.children.find((node) => node.type === 'heading')) as
      | { type: 'heading'; children: MdAst.PhrasingContent[] }
      | undefined
    if (!heading) return

    const subheading = extractSubheading(heading.children)
    const title = getPhrasingContentText(subheading?.headingChildren ?? heading.children).trim()
    const description = subheading
      ? getPhrasingContentText(subheading.subheadingChildren).trim()
      : undefined

    // Build new frontmatter
    const newLines: string[] = []
    if (!hasTitle && title) newLines.push(`title: "${title.replace(/"/g, '\\"')}"`)
    if (!hasDescription && description)
      newLines.push(`description: "${description.replace(/"/g, '\\"')}"`)

    if (newLines.length === 0) return

    if (frontmatterNode) frontmatterNode.value = [...newLines, existingFrontmatter].join('\n')
    else
      tree.children.unshift({
        type: 'yaml',
        value: newLines.join('\n'),
      } as never)
  }
}

export function remarkDetails() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'details') return

      // biome-ignore lint/suspicious/noAssignInExpressions: _
      const data = node.data || (node.data = {})

      const summaryChild = node.children[0]
      if (summaryChild?.type === 'paragraph' && summaryChild.data?.directiveLabel)
        summaryChild.data.hName = 'summary'
      else
        node.children.unshift({
          type: 'paragraph',
          children: [{ type: 'text', value: 'Details' }],
          data: { hName: 'summary' },
        } as never)

      data.hName = 'details'
    })
  }
}

/**
 * Remark plugin that extracts the frontmatter from the document.
 */
export function remarkExtractFrontmatter() {
  return (tree: MdAst.Root, file: VFile) => {
    const yamlNode = tree.children.find((node) => node.type === 'yaml')
    if (yamlNode) file.data['frontmatter'] = yaml.parse(yamlNode.value)
  }
}

/**
 * Remark plugin that adds metadata to the frontmatter.
 */
function remarkMetaFrontmatter() {
  return (tree: MdAst.Root, file: VFile) => {
    const yamlNode = tree.children.find((node) => node.type === 'yaml')
    const existing = yamlNode ? yaml.parse(yamlNode.value) : {}
    const lastModified = file.path
      ? fs.statSync(file.path).mtime.toISOString()
      : new Date().toISOString()
    const data = { ...existing, lastModified }

    if (yamlNode) yamlNode.value = yaml.stringify(data).trim()
    else tree.children.unshift({ type: 'yaml', value: yaml.stringify(data).trim() })
  }
}

export function remarkSteps() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'steps') return

      // biome-ignore lint/suspicious/noAssignInExpressions: _
      const data = node.data || (node.data = {})
      const tagName = 'div'

      node.attributes = {
        ...node.attributes,
        'data-v-steps': 'true',
      }

      data.hName = tagName
      data.hProperties = node.attributes || {}

      const depth =
        (node.children.find((child) => child.type === 'heading') as MdAst.Heading)?.depth ?? 2

      // biome-ignore lint/suspicious/noExplicitAny: _
      let currentChild: any
      const children = []
      for (const child of node.children) {
        if (child.type === 'heading' && child.depth === depth) {
          if (currentChild && currentChild.children.length > 0) children.push(currentChild)
          currentChild = {
            type: 'paragraph',
            children: [],
            data: {
              hName: 'div',
              hProperties: {
                'data-v-depth': depth,
              },
            },
          } satisfies MdAst.Paragraph
        }
        currentChild?.children.push(child)
      }
      children.push(currentChild)

      node.children = children
    })
  }
}

/**
 * Remark plugin that handles :::terminal directive.
 * Stitches command and output code blocks together visually.
 *
 * Usage:
 * :::terminal
 * ```bash
 * forge test
 * ```
 * ```ansi
 * [32m[PASS][0m test passed
 * ```
 * :::
 *
 * The first code block is the command (with copy button).
 * Subsequent code blocks are output (no copy, rendered with ANSI support).
 */
export function remarkTerminal() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'terminal') return

      // biome-ignore lint/suspicious/noAssignInExpressions: _
      const data = node.data || (node.data = {})
      const tagName = 'div'

      node.attributes = {
        ...node.attributes,
        'data-v-terminal': '',
      }

      data.hName = tagName
      data.hProperties = node.attributes || {}

      let isFirst = true
      node.children = node.children
        .map((child) => {
          if (child.type !== 'code') return child
          const isCommand = isFirst
          isFirst = false
          return {
            type: 'paragraph',
            children: [child],
            data: {
              hName: 'div',
              hProperties: isCommand
                ? { 'data-v-terminal-command': '' }
                : { 'data-v-terminal-output': '' },
            },
          }
        })
        .filter(Boolean) as (MdAst.BlockContent | MdAst.DefinitionContent)[]
    })
  }
}

/**
 * Remark plugin that strips the JSX expressions from the document.
 */
export function remarkStripJs() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, 'mdxjsEsm', (node) => {
      tree.children.splice(tree.children.indexOf(node), 1)
    })
    UnistUtil.visit(tree, 'mdxFlowExpression', (node) => {
      tree.children.splice(tree.children.indexOf(node), 1)
    })
  }
}

/**
 * Remark plugin that strips inline twoslash cache comments
 * (`// @twoslash-cache: ...`) from code blocks. Used for the markdown
 * (`.md`/llms) output so the persisted cache never leaks into rendered pages.
 */
export function remarkStripInlineCache() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, 'code', (node) => {
      node.value = InlineCache.stripInlineCacheComments(node.value)
    })
  }
}

/**
 * Remark plugin that strips the frontmatter from the document.
 */
export function remarkStripFrontmatter() {
  return (tree: MdAst.Root) => {
    const yamlNode = tree.children.find((node) => node.type === 'yaml')
    if (yamlNode) tree.children.splice(tree.children.indexOf(yamlNode), 1)
  }
}

/**
 * Remark plugin that extracts subheadings from h1 elements.
 * Converts `# Title [Subheading text]` into a `<header>` with both title and subtitle.
 */
export function remarkSubheading() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, 'heading', (node, index, parent) => {
      if (index === undefined || !parent) return
      if (node.depth !== 1) return
      if (node.children.length === 0) return

      const subheading = extractSubheading(node.children)
      if (!subheading) return
      node.children = subheading.headingChildren

      // Build hgroup wrapper with h1 and optional subtitle (p)
      const hgroup = {
        type: 'paragraph',
        data: { hName: 'hgroup' },
        children: [
          node as unknown as MdAst.PhrasingContent,
          ...(subheading.subheadingChildren.length > 0
            ? [
                {
                  type: 'paragraph',
                  data: { hName: 'p' },
                  children: subheading.subheadingChildren,
                } as unknown as MdAst.PhrasingContent,
              ]
            : []),
        ],
      } satisfies MdAst.Paragraph

      // Replace heading with hgroup wrapper
      parent.children.splice(index, 1, hgroup)
      return UnistUtil.SKIP
    })
  }
}

type Subheading = {
  headingChildren: MdAst.PhrasingContent[]
  subheadingChildren: MdAst.PhrasingContent[]
}

export function extractSubheading(children: MdAst.PhrasingContent[]): Subheading | undefined {
  const lastChild = children[children.length - 1]
  if (!isText(lastChild) || !lastChild.value.endsWith(']')) return

  for (let index = children.length - 1; index >= 0; index--) {
    const child = children[index]
    if (!isText(child)) continue

    const openIndex = child.value.lastIndexOf(' [')
    if (openIndex === -1) continue

    const headingChildren = clonePhrasingContent(children.slice(0, index))
    const headingText = child.value.slice(0, openIndex)
    if (headingText) headingChildren.push({ ...child, value: headingText })

    const subheadingChildren = clonePhrasingContent(children.slice(index + 1))
    const subheadingText = child.value.slice(openIndex + 2)
    if (subheadingText) subheadingChildren.unshift({ ...child, value: subheadingText })

    const finalChild = subheadingChildren[subheadingChildren.length - 1]
    if (!isText(finalChild)) return
    finalChild.value = finalChild.value.slice(0, -1)

    return {
      headingChildren,
      subheadingChildren: subheadingChildren.filter(
        (child) => !isText(child) || child.value.length > 0,
      ),
    }
  }

  return undefined
}

export function getPhrasingContentText(children: MdAst.PhrasingContent[]): string {
  return children.map(getPhrasingNodeText).join('')
}

function clonePhrasingContent(children: MdAst.PhrasingContent[]) {
  return children.map((child) => structuredClone(child))
}

function getPhrasingNodeText(child: MdAst.PhrasingContent): string {
  if ('value' in child && typeof child.value === 'string') return child.value
  if ('children' in child) return getPhrasingContentText(child.children)
  if ('alt' in child && typeof child.alt === 'string') return child.alt
  return ''
}

function isText(child: MdAst.PhrasingContent | undefined): child is MdAst.Text {
  return child?.type === 'text'
}

const filenameRegex = /filename=["']([^"']+)["']/
const titleFilenameRegex = /\[([./\w-]+\.(?:[cm]?[jt]sx?|json|sol|rs|toml|ya?ml|css|html|mdx?))\]/

/**
 * Remark plugin that processes virtual file snippets defined with `filename="..."` meta.
 *
 * This enables:
 * 1. Code blocks with `filename="example.ts"` to be referenced by other code blocks
 * 2. `// [!include example.ts]` markers to pull in virtual file content
 * 3. Twoslash integration: imports from virtual files inject `@filename` directives
 */
export function remarkFilename(): remarkFilename.ReturnType {
  return (tree: MdAst.Root) => {
    const allCodeNodes = getCodeNodes(tree)
    const documentVirtualFiles = getVirtualFiles(allCodeNodes)
    const processed = new Set<MdAst.Code>()

    UnistUtil.visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'code-group') return

      const codeNodes = getCodeNodes(node)
      const virtualFiles = getVirtualFiles(codeNodes)
      if (virtualFiles.size === 0) return

      processCodeNodes(codeNodes, virtualFiles)
      for (const node of codeNodes) processed.add(node)
    })

    if (documentVirtualFiles.size === 0) return

    const codeNodes = allCodeNodes.filter((node) => !processed.has(node))
    processCodeNodes(codeNodes, documentVirtualFiles)
  }
}

export declare namespace remarkFilename {
  type ReturnType = (tree: MdAst.Root) => void
}

function getCodeNodes(node: unknown): MdAst.Code[] {
  const codeNodes: MdAst.Code[] = []
  UnistUtil.visit(node as MdAst.Root, 'code', (node) => {
    codeNodes.push(node)
  })
  return codeNodes
}

function getVirtualFiles(codeNodes: MdAst.Code[]): Map<string, string> {
  const virtualFiles = new Map<string, string>()
  for (const node of codeNodes) {
    const fileName = getCodeFileName(node)
    if (!fileName) continue
    // Strip any inline twoslash cache comment so it isn't inlined ahead of a
    // host block's code when this virtual file is imported/included. The
    // original node keeps its comment for its own rendering.
    virtualFiles.set(fileName, InlineCache.stripInlineCacheComments(node.value))
  }
  return virtualFiles
}

function processCodeNodes(codeNodes: MdAst.Code[], virtualFiles: Map<string, string>) {
  const getVirtualSource = Snippets.createVirtualSourceGetter({ virtualFiles })

  for (const node of codeNodes) {
    if (node.meta?.includes('twoslash')) {
      node.value = Snippets.processImports({ code: node.value, virtualFiles })
    }
    node.value = Snippets.processIncludes({ code: node.value, getSource: getVirtualSource })
  }
}

function getCodeFileName(node: MdAst.Code): string | undefined {
  if (!node.meta) return undefined
  const filename = node.meta.match(filenameRegex)?.[1]
  if (filename) return filename
  return node.meta.match(titleFilenameRegex)?.[1]
}

/**
 * Remark plugin that transforms `:::file-tree` directives into file tree components.
 *
 * Syntax:
 * ```md
 * :::file-tree
 * - file.ts
 * - another.ts
 * - +folder
 *   - nested.ts
 * :::
 * ```
 *
 * The content is parsed as a nested list where folders can be represented with
 * a preceding `+` prefix.
 */
export function remarkFileTree(config: Config.Config): remarkFileTree.ReturnType {
  const customIcons = config.groupIcons?.customIcons

  type FileTreeItem = {
    name: string
    type: 'file' | 'folder'
    comment?: string | undefined
    highlighted?: boolean | undefined
    icon?: string | undefined
    tooltip?: string | undefined
    items?: FileTreeItem[] | undefined
  }

  // Matches a trailing `{info="..."}` or `{info=...}` (quotes optional, value
  // may be empty) on a file-tree row.
  //
  // Used in two places: against a raw text node when the row is parsed as
  // Markdown, and against the body of an `mdxTextExpression` (which contains
  // the contents *between* the braces) when the row is parsed as MDX. MDX
  // intercepts `{...}` as a JS expression embed, so the braces aren't part of
  // the captured value in that case.
  const tooltipRegex = /\s*\{info(?:=(?:"([^"]*)"|([^}]*)))?\}\s*$/
  const tooltipBodyRegex = /^\s*info(?:=(?:"([^"]*)"|([^}]*)))?\s*$/

  async function resolveAllIcons(items: FileTreeItem[]): Promise<void> {
    await Promise.all(
      items.map(async (item) => {
        if (item.type === 'file' && item.name !== '...') {
          const iconId = Icons.matchIcon(item.name, customIcons)
          if (iconId) {
            const svg = await Icons.resolveIcon(iconId)
            if (svg) item.icon = svg
          }
        }
        if (item.items) await resolveAllIcons(item.items)
      }),
    )
  }

  return async (tree: MdAst.Root) => {
    const fileTreeNodes: Array<{ node: MdAst.Parent; data: FileTreeItem[] }> = []

    UnistUtil.visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if ((node as { name?: string }).name !== 'file-tree') return

      // biome-ignore lint/suspicious/noAssignInExpressions: _
      const nodeData = node.data || (node.data = {})

      function getPhrasingText(node: MdAst.PhrasingContent): string {
        if (node.type === 'text' || node.type === 'inlineCode') return node.value
        if ('children' in node) return node.children.map(getPhrasingText).join('')
        return ''
      }

      function extractFileTree(children: MdAst.RootContent[]): FileTreeItem[] {
        const result: FileTreeItem[] = []

        for (const child of children) {
          if (child.type !== 'list') continue

          for (const listItem of child.children) {
            if (listItem.type !== 'listItem') continue

            // Get the text content from the first paragraph
            const paragraph = listItem.children.find(
              (c): c is MdAst.Paragraph => c.type === 'paragraph',
            )
            if (!paragraph) continue

            // Pre-extract trailing `{info="..."}` so its (possibly space-
            // containing) value doesn't get mis-split into name/comment below.
            //
            // MDX intercepts `{...}` as a JS expression embed (mdxTextExpression
            // with body `info="..."`); plain Markdown leaves it as text. Handle
            // both: a trailing mdxTextExpression takes precedence, otherwise
            // look at the last text node.
            let tooltip: string | undefined
            const lastChild = paragraph.children[paragraph.children.length - 1]
            if (lastChild?.type === 'mdxTextExpression') {
              const expr = lastChild as MdAst.PhrasingContent & { value: string }
              const match = expr.value.match(tooltipBodyRegex)
              if (match) {
                tooltip = (match[1] ?? match[2] ?? '').trim()
                // Drop the expression entirely; an mdxTextExpression has no
                // text representation in the row.
                paragraph.children.pop()
              }
            } else {
              const lastText = [...paragraph.children]
                .reverse()
                .find((c): c is MdAst.Text => c.type === 'text')
              if (lastText) {
                const match = lastText.value.match(tooltipRegex)
                if (match) {
                  tooltip = (match[1] ?? match[2] ?? '').trim()
                  lastText.value = lastText.value.replace(tooltipRegex, '')
                }
              }
            }

            let name = ''
            let comment = ''
            let folder = false
            let highlighted = false
            let foundName = false

            for (const pChild of paragraph.children) {
              if (
                pChild.type === 'text' ||
                pChild.type === 'inlineCode' ||
                pChild.type === 'strong'
              ) {
                // Only highlight if strong is in filename, not comment
                if (pChild.type === 'strong' && !foundName) highlighted = true

                const textValue = getPhrasingText(pChild)

                if (foundName) {
                  comment += textValue
                } else if (textValue.startsWith('+')) {
                  folder = true
                  const folderText = textValue.slice(1)
                  const spaceIndex = folderText.indexOf(' ')
                  if (spaceIndex !== -1) {
                    name += folderText.slice(0, spaceIndex)
                    comment += folderText.slice(spaceIndex + 1)
                    foundName = true
                  } else {
                    name += folderText.trim()
                  }
                } else {
                  const spaceIndex = textValue.indexOf(' ')
                  if (spaceIndex !== -1) {
                    name += textValue.slice(0, spaceIndex)
                    comment += textValue.slice(spaceIndex + 1)
                    foundName = true
                  } else {
                    name += textValue
                  }
                }
              }
            }

            name = name.trim()
            comment = comment.trim()
            if (!name) continue

            const item: FileTreeItem = {
              name,
              type: folder ? 'folder' : 'file',
              ...(comment && { comment }),
              ...(highlighted && { highlighted }),
              ...(tooltip && { tooltip }),
            }

            // Check for nested lists (children of this list item)
            const nestedList = listItem.children.filter((c): c is MdAst.List => c.type === 'list')
            if (nestedList.length > 0) {
              item.items = extractFileTree(nestedList)
              if (item.type === 'file') item.type = 'folder'
            } else if (folder) {
              item.items = []
            }

            result.push(item)
          }
        }

        return result
      }

      const fileTreeData = extractFileTree(node.children)
      fileTreeNodes.push({ node: node as MdAst.Parent, data: fileTreeData })

      nodeData.hName = 'div'
      nodeData.hProperties = {
        ...(node.attributes ?? {}),
        'data-v-file-tree': 'true',
        'data-v-file-tree-items': '', // Will be set after icon resolution
      }

      // Clear children since we're passing data via attributes
      node.children = []
    })

    // Resolve all icons in parallel across all file trees
    await Promise.all(fileTreeNodes.map(({ data }) => resolveAllIcons(data)))

    // Now set the serialized data with resolved icons
    for (const { node, data } of fileTreeNodes) {
      const props = node.data?.hProperties as Record<string, unknown> | undefined
      if (props) {
        props['data-v-file-tree-items'] = JSON.stringify(data)
      }
    }
  }
}

export declare namespace remarkFileTree {
  type ReturnType = (tree: MdAst.Root) => Promise<void>
}

/**
 * Remark plugin that transforms `::changelog{limit=10}` leaf directives into Changelog components.
 *
 * Syntax:
 * - `::changelog` – renders a Changelog with default limit (999)
 * - `::changelog{limit=10}` – renders a Changelog with limit of 10
 */
export function remarkChangelog(): remarkChangelog.ReturnType {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, 'leafDirective', (node) => {
      if (node.name !== 'changelog') return

      // biome-ignore lint/suspicious/noAssignInExpressions: _
      const data = node.data || (node.data = {})

      // Malformed limits (NaN, zero, negative) fall back to the default.
      const parsed = Number.parseInt(node.attributes?.['limit'] ?? '', 10)
      const limit = Number.isInteger(parsed) && parsed > 0 ? parsed : 999

      data.hName = 'div'
      data.hProperties = {
        'data-v-changelog': 'true',
        'data-v-changelog-limit': String(limit),
      }
    })
  }
}

export declare namespace remarkChangelog {
  type ReturnType = (tree: MdAst.Root) => void
}

/**
 * Remark plugin (markdown/`txt` pipeline) that renders `::changelog` leaf
 * directives as release markdown, so `llms.txt` and the per-page markdown
 * twins carry the releases instead of a literal `::changelog` line — the
 * content only exists behind the adapter, so without this the markdown
 * output loses the page's entire content.
 *
 * Mirrors the react pipeline's `remarkChangelog` + `Changelog` component
 * pair: same adapter, `{limit=N}` handling, and duplicate-title
 * normalization. Failures (no adapter, offline, rate limit) degrade to an
 * HTML comment — a missing changelog must never fail the llms/markdown build.
 */
export function remarkChangelogMarkdown(
  options: remarkChangelogMarkdown.Options = {},
): remarkChangelogMarkdown.ReturnType {
  return async (tree: MdAst.Root) => {
    // Collect matches first (visit is sync), then fetch and splice.
    const found: { index: number; limit: number; parent: MdAst.Parent }[] = []
    UnistUtil.visit(tree, 'leafDirective', (node, index, parent) => {
      if (node.name !== 'changelog') return
      if (index === undefined || !parent) return
      // Malformed limits (NaN, zero, negative) fall back to the default.
      const parsed = Number.parseInt(node.attributes?.['limit'] ?? '', 10)
      const limit = Number.isInteger(parsed) && parsed > 0 ? parsed : 999
      found.push({ index, limit, parent })
    })
    if (found.length === 0) return

    // Splice back-to-front so earlier indices stay valid.
    for (const { index, limit, parent } of found.reverse())
      parent.children.splice(index, 1, ...(await render(limit)))

    async function render(limit: number): Promise<MdAst.RootContent[]> {
      const unavailable: MdAst.RootContent[] = [
        { type: 'html', value: '<!-- changelog unavailable -->' },
      ]
      const adapter = options.changelog
      if (!adapter) return unavailable
      try {
        const releases = await adapter.fetch({ limit, prereleases: false })
        const markdown = releases
          .map((release) => {
            const date = release.date.slice(0, 10)
            const body = Changelog.stripDuplicateTitle({
              body: release.body,
              title: release.title,
            })
            const title =
              release.title && release.title !== release.version ? ` — ${release.title}` : ''
            return `## ${release.version}${title} (${date})\n\n${body}`.trim()
          })
          .join('\n\n')
        // Parsed without GFM on purpose: the outer txt pipeline stringifies
        // without GFM extensions, so GFM nodes (tables, …) spliced in here
        // would make it throw. Plain parsing keeps GFM constructs as
        // readable literal text.
        return unified().use(remarkParse).parse(markdown).children
      } catch (error) {
        logger.warn(
          `Failed to render \`::changelog\` in markdown output: ${error instanceof Error ? error.message : String(error)}`,
          { timestamp: true },
        )
        return unavailable
      }
    }
  }
}

export declare namespace remarkChangelogMarkdown {
  type Options = {
    /** Changelog adapter to fetch releases from (`config.changelog`). */
    changelog?: Changelog.Adapter | undefined
  }
  type ReturnType = (tree: MdAst.Root) => Promise<void>
}
