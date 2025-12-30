import * as fs from 'node:fs'
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
import type { BuiltinTheme, CodeOptionsMultipleThemes } from 'shiki'
import type { PluggableList } from 'unified'
import * as UnistUtil from 'unist-util-visit'
import type { VFile } from 'vfile'
import * as yaml from 'yaml'
import type * as Config from './config.js'
import * as ShikiTransformers from './shiki-transformers.js'
import type { ExactPartial, UnionOmit } from './types.js'

export { default as remarkFrontmatter } from 'remark-frontmatter'
export { default as remarkMdxFrontmatter } from 'remark-mdx-frontmatter'

export function getCompileOptions(
  type: 'txt' | 'react',
  config: Config.Config,
): Omit<CompileOptions, 'remarkPlugins' | 'rehypePlugins' | 'recmaPlugins'> & {
  remarkPlugins: PluggableList
  rehypePlugins: PluggableList
  recmaPlugins: PluggableList
} {
  const { codeHighlight, markdown, twoslash } = config
  const { jsxImportSource = 'react' } = markdown ?? {}

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
          rehypeAutolinkHeadings,
          rehypeShiki({ ...codeHighlight, twoslash }),
          rehypeSlug,
          ...(markdown?.rehypePlugins ?? []),
          rehypeCodeInLink,
        ],
        remarkPlugins: [
          remarkFrontmatter,
          remarkCallout,
          remarkCodeGroup,
          remarkDefaultFrontmatter,
          remarkDetails,
          remarkDirective,
          remarkGfm,
          remarkMetaFrontmatter,
          remarkMdxFrontmatter,
          remarkSteps,
          remarkSubheading,
          remarkMdScope,
          ...(markdown?.remarkPlugins ?? []),
        ],
        recmaPlugins: [recmaMdxLayout, ...(markdown?.recmaPlugins ?? [])],
      }
    throw new Error(`Invalid type: ${type}`)
  })()

  return {
    ...markdown,
    jsxImportSource,
    recmaPlugins,
    rehypePlugins,
    remarkPlugins,
  }
}

/**
 * Recma plugin that wraps the MDX default export with MdxLayout.
 * This gives the layout access to frontmatter and path props.
 */
export function recmaMdxLayout() {
  return (tree: Estree.Program, vfile: VFile) => {
    // Skip layouts, roots, and slices - they shouldn't be wrapped
    const fileName = vfile.basename ?? ''
    if (!fileName.endsWith('.mdx') && !fileName.endsWith('.md')) return

    // Find the default export declaration
    const defaultExportIndex = tree.body.findIndex(
      (node) => node.type === 'ExportDefaultDeclaration',
    )
    if (defaultExportIndex === -1) return

    // Add imports for MdxLayout and createElement at the top
    const importAst = EstreeUtil.fromJs(
      `import { MdxPage as _MdxPage } from 'vocs/react';
       import { components as _components } from 'virtual:vocs/mdx-components';
       import { createElement as _createElement } from 'react';`,
      { module: true },
    )
    tree.body.unshift(...importAst.body)

    const wrapperAst = EstreeUtil.fromJs(
      `export function WithPageLayout(props = {}) {
        return _createElement(_MdxPage, { ...props, frontmatter: typeof frontmatter !== 'undefined' ? frontmatter : undefined, pathname: props.path }, _createElement(MDXContent, { ...props, components: _components }));
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
 * Remark plugin that adds `data-md` attribute to MDX component elements.
 * This enables scoped styling for markdown-rendered content, without conflicting with user styles.
 */
export function remarkMdScope() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, (node) => {
      const n = node as MdAst.Node & { data?: { hProperties?: Record<string, unknown> } }
      n.data ??= {}
      n.data.hProperties ??= {}
      n.data.hProperties['data-md'] = ''
    })
  }
}

/**
 * Rehype plugin that processes code blocks with Shiki.
 */
export function rehypeShiki(
  options: ExactPartial<rehypeShiki.Options> = {},
): [typeof shiki, RehypeShikiOptions] {
  const { themes, twoslash = true } = options
  return [
    shiki,
    {
      ...(options ?? {}),
      defaultColor: 'light-dark()',
      inline: 'tailing-curly-colon',
      rootStyle: false,
      themes,
      // TODO: infer `langs` for faster cold start.
      transformers: [
        twoslash
          ? ShikiTransformers.twoslash(typeof twoslash === 'object' ? twoslash : {})
          : undefined,
        ShikiTransformers.lineNumbers(),
        ShikiTransformers.notationDiff(),
        ShikiTransformers.notationFocus(),
        ShikiTransformers.notationHighlight(),
        ShikiTransformers.notationWordHighlight(),
        ShikiTransformers.removeNotationEscape(),
        ShikiTransformers.transformerTagLine(),
        ShikiTransformers.transformerEmptyLine(),
        ...(options.transformers ?? []),
      ].filter(Boolean),
    } as RehypeShikiOptions,
  ]
}

export declare namespace rehypeShiki {
  export type Options = UnionOmit<ExactPartial<RehypeShikiOptions>, 'inline' | 'rootStyle'> &
    UnionOmit<CodeOptionsMultipleThemes<BuiltinTheme>, 'defaultColor'> & {
      twoslash?: ShikiTransformers.twoslash.Options | false | undefined
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
          data: { hProperties: { 'data-callout-title': true } },
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
        'data-callout': true,
        'data-context': node.name !== 'callout' ? node.name : 'info',
      }
    })
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
        'data-code-group': '',
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
                    'data-code-group-item': '',
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
    // biome-ignore lint/complexity/useLiteralKeys: _
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
        'data-steps': 'true',
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
                'data-depth': depth,
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
