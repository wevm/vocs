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
import type {
  BuiltinTheme,
  CodeOptionsMultipleThemes,
  LanguageRegistration,
  ShikiTransformer,
} from 'shiki'
import { bundledLanguages } from 'shiki/bundle/web'
import rust from 'shiki/langs/rust.mjs'
import solidity from 'shiki/langs/solidity.mjs'

import type { Pluggable, PluggableList } from 'unified'
import * as UnistUtil from 'unist-util-visit'
import type { VFile } from 'vfile'
import { createLogger } from 'vite'
import * as yaml from 'yaml'
import type * as Config from './config.js'
import * as Icons from './icons.js'
import { remarkVocsScope } from './remark-vocs-scope.js'
import { remarkSandbox } from './sandbox.js'
import * as ShikiTransformers from './shiki-transformers.js'
import * as Snippets from './snippets.js'
import type { ExactPartial, UnionOmit } from './types.js'

export { default as remarkFrontmatter } from 'remark-frontmatter'
export { default as remarkMdxFrontmatter } from 'remark-mdx-frontmatter'

const defaultLanguages = {
  ...bundledLanguages,
  rust,
  solidity,
} as const

/** Set of all valid language names including aliases from explicitly imported languages */
const validLanguageNames = new Set([
  ...Object.keys(bundledLanguages),
  // Extract names and aliases from explicitly imported language modules (non-function values)
  ...Object.values(defaultLanguages).flatMap((lang) =>
    typeof lang === 'function' ? [] : lang.flatMap((l) => [l.name, ...(l.aliases ?? [])]),
  ),
])

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
                ariaLabel: 'Link to this section',
                className: ['heading-anchor'],
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
          rehypeShiki({ ...codeHighlight, cacheDir, rootDir, srcDir, twoslash }),
          ...(markdown?.rehypePlugins ?? []),
          rehypeCodeInLink,
          rehypeLinks(config),
        ],
        remarkPlugins: [
          remarkMermaid,
          remarkFrontmatter,
          [remarkFileTree, config] as Pluggable,
          remarkCallout,
          remarkChangelog,
          remarkCodeGroup,
          remarkLangCommaAttrs,
          [remarkCodeTitle, { additionalLanguages: twoslashTransformerLangs }] as Pluggable,
          remarkDefaultFrontmatter,
          remarkDetails,
          remarkDirective,
          remarkBadge,
          remarkFilename,
          remarkGfm,
          remarkMetaFrontmatter,
          remarkMdxFrontmatter,
          remarkSandbox,
          remarkSteps,
          remarkSubheading,
          remarkVocsScope,
          ...(markdown?.remarkPlugins ?? []),
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
  const pagesDirPath = path.join(rootDir, srcDir, pagesDir)

  const layoutPaths = new Map<string, string>()

  return () => (tree: Estree.Program, vfile: VFile) => {
    const fileName = vfile.basename ?? ''
    if (!fileName.endsWith('.mdx') && !fileName.endsWith('.md')) return

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

    const lastModified = vfile.path ? fs.statSync(vfile.path).mtime.toISOString() : undefined
    const filePath = vfile.path ? path.relative(pagesDirPath, vfile.path) : undefined

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
          filePath: ${filePath ? `"${filePath}"` : 'undefined'},
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

    UnistUtil.visit(tree, 'element', (node) => {
      const element = node as HAst.Element
      if (element.tagName !== 'a') return

      const href = element.properties?.['href']
      if (typeof href !== 'string') return

      // Skip external links and hash-only links
      if (href.match(/^(https?:\/\/|mailto:|tel:|#)/)) return

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

      // Check for file existence (try with extensions if not present)
      const exists =
        fs.existsSync(resolvedPath) ||
        extensions.some((ext) => fs.existsSync(`${resolvedPath}${ext}`)) ||
        extensions.some((ext) => fs.existsSync(`${resolvedPath}/index${ext}`))

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
  const { cacheDir, srcDir, rootDir, themes, twoslash = true } = options

  // Process twoslash transformers - inject cacheDir if they're factory functions
  const rawTransformers =
    twoslash && typeof twoslash === 'object' ? twoslash.transformers : undefined
  const twoslashTransformers = rawTransformers?.map((t) =>
    typeof t === 'function' ? t({ cacheDir }) : t,
  )

  // Extract langs from transformers that provide them (e.g., experimental_rust)
  const transformerLangs =
    rawTransformers?.flatMap((t) => ('langs' in t ? (t.langs as LanguageRegistration[]) : [])) ?? []

  return [
    shiki,
    {
      ...(options ?? {}),
      defaultColor: 'light-dark()',
      fallbackLanguage: 'plaintext',
      inline: 'tailing-curly-colon',
      rootStyle: false,
      themes,
      langs: [...Object.values(defaultLanguages), ...transformerLangs],
      // TODO: infer `langs` for faster cold start.
      transformers: [
        rootDir && srcDir ? ShikiTransformers.notationInclude({ srcDir, rootDir }) : undefined,
        twoslash
          ? ShikiTransformers.twoslash(
              typeof twoslash === 'object' ? { ...twoslash, cacheDir } : {},
            )
          : undefined,
        ...(twoslashTransformers ?? []),
        ShikiTransformers.emptyLine(),
        ShikiTransformers.customTag(),
        ShikiTransformers.lineNumbers(),
        ShikiTransformers.notationDiff(),
        ShikiTransformers.notationFocus(),
        ShikiTransformers.notationHighlight(),
        ShikiTransformers.notationWordHighlight(),
        ...ShikiTransformers.notationCollapse(),
        ...ShikiTransformers.notationFold(),
        ShikiTransformers.removeNotationEscape(),
        ShikiTransformers.shellPrompt(options.shellPrompt),
        ShikiTransformers.tagLine(),
        ShikiTransformers.title(),
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

    // Find first h1
    const h1 = tree.children.find(
      (node) => node.type === 'heading' && (node as { depth: number }).depth === 1,
    ) as { type: 'heading'; children: { type: string; value?: string }[] } | undefined
    if (!h1) return

    // Extract text content
    const textContent = h1.children.map((child) => child.value ?? '').join('')

    // Parse title and description: "My Title [Description here]"
    const match = textContent.match(/^(.+?)\s*\[(.+)\]$/)
    const title = match?.[1]?.trim() ?? textContent.trim()
    const description = match?.[2]?.trim()

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
  const subheadingRegex = / \[(.*)\]$/

  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, 'heading', (node, index, parent) => {
      if (index === undefined || !parent) return
      if (node.depth !== 1) return
      if (node.children.length === 0) return

      // Find child with subheading pattern
      const textChild = node.children.find(
        (child): child is MdAst.Text => child.type === 'text' && subheadingRegex.test(child.value),
      )
      if (!textChild) return

      // Extract and remove subheading from text
      const match = textChild.value.match(subheadingRegex)
      if (!match) return
      const subheading = match[1]
      textChild.value = textChild.value.replace(match[0], '')

      // Build hgroup wrapper with h1 and optional subtitle (p)
      const hgroup = {
        type: 'paragraph',
        data: { hName: 'hgroup' },
        children: [
          node as unknown as MdAst.PhrasingContent,
          ...(subheading
            ? [
                {
                  type: 'paragraph',
                  data: { hName: 'p' },
                  children: [{ type: 'text', value: subheading }],
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

const filenameRegex = /filename="([^"]+)"/

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
    const virtualFiles = new Map<string, string>()
    const codeNodes: MdAst.Code[] = []

    UnistUtil.visit(tree, 'code', (node) => {
      codeNodes.push(node)
      if (!node.meta?.includes('filename')) return
      const match = node.meta.match(filenameRegex)
      const fileName = match?.[1]
      if (!fileName) return
      virtualFiles.set(fileName, node.value)
    })

    if (virtualFiles.size === 0) return

    const getVirtualSource = Snippets.createVirtualSourceGetter({ virtualFiles })

    for (const node of codeNodes) {
      if (node.meta?.includes('twoslash')) {
        node.value = Snippets.processImports({ code: node.value, virtualFiles })
      }
      node.value = Snippets.processIncludes({ code: node.value, getSource: getVirtualSource })
    }
  }
}

export declare namespace remarkFilename {
  type ReturnType = (tree: MdAst.Root) => void
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
    items?: FileTreeItem[] | undefined
  }

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

            let name = ''
            let comment = ''
            let folder = false
            let highlighted = false
            let foundName = false

            for (const pChild of paragraph.children) {
              if (pChild.type === 'text' || pChild.type === 'strong') {
                // Only highlight if strong is in filename, not comment
                if (pChild.type === 'strong' && !foundName) highlighted = true

                const textValue =
                  pChild.type === 'text'
                    ? pChild.value
                    : pChild.children
                        .filter((c): c is MdAst.Text => c.type === 'text')
                        .map((c) => c.value)
                        .join('')

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

      const limit = node.attributes?.['limit'] ? Number.parseInt(node.attributes['limit'], 10) : 999

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
