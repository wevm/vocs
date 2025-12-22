import shiki, { type RehypeShikiOptions } from '@shikijs/rehype'
import * as EstreeUtil from 'esast-util-from-js'
import type * as Estree from 'estree'
import type * as MdAst from 'mdast'
import * as MdAstExtensions from 'mdast-util-mdx'
import * as MdAstUtil from 'mdast-util-to-markdown'
import type { VFile } from 'vfile'
import type { ExactPartial } from '../types.js'
import * as Context from './context.js'
import * as ShikiTransformers from './shiki-transformers.js'

export { default as remarkFrontmatter } from 'remark-frontmatter'
export { default as remarkMdxFrontmatter } from 'remark-mdx-frontmatter'

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
      `import { MdxPageLayout as _MdxPageLayout } from 'vocs';
       import { createElement as _createElement } from 'react';`,
      { module: true },
    )
    tree.body.unshift(...importAst.body)

    const wrapperAst = EstreeUtil.fromJs(
      `export function WithPageLayout(props = {}) {
        return _createElement(_MdxPageLayout, { ...props, frontmatter: typeof frontmatter !== 'undefined' ? frontmatter : undefined, pathname: props.path }, _createElement(MDXContent, props));
      }`,
      { module: true },
    )

    // Add the wrapper export
    tree.body.push(...wrapperAst.body)
  }
}

/**
 * Rehype plugin that processes code blocks with Shiki.
 */
export function rehypeShiki(
  options: ExactPartial<rehypeShiki.Options> = {},
): [typeof shiki, RehypeShikiOptions] {
  const { twoslash = true } = options
  return [
    shiki,
    {
      ...(options ?? {}),
      themes: (options as { themes?: unknown }).themes ?? {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      transformers: [
        twoslash
          ? ShikiTransformers.twoslash(typeof twoslash === 'object' ? twoslash : {})
          : undefined,
        ...(options.transformers ?? []),
      ],
    } as RehypeShikiOptions,
  ]
}

export declare namespace rehypeShiki {
  export type Options = ExactPartial<RehypeShikiOptions> & {
    twoslash?: ShikiTransformers.twoslash.Options | false | undefined
  }
}

/**
 * Remark plugin that exports the processed markdown content from MDX files.
 * Only runs for files marked in the llmsContext.
 */
export function remarkContentExport() {
  return (tree: MdAst.Root, vfile: VFile) => {
    try {
      const contentType = Context.contentType.get(vfile.path)
      if (contentType !== 'md') return

      const content = MdAstUtil.toMarkdown(tree, { extensions: [MdAstExtensions.mdxToMarkdown()] })
      const code = `export const content = ${JSON.stringify(content)}`

      tree.children.unshift({
        type: 'mdxjsEsm',
        value: code,
        data: { estree: EstreeUtil.fromJs(code, { module: true }) },
      } as never)
    } catch {}
  }
}

/**
 * Remark plugin that extracts frontmatter attributes from the document.
 */
export function remarkDefaultFrontmatter() {
  return (tree: MdAst.Root, vfile: VFile) => {
    const contentType = Context.contentType.get(vfile.path)
    if (contentType === 'md') return

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
