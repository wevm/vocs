import * as fs from 'node:fs'
import * as esast from 'esast-util-from-js'
import type { ExportNamedDeclaration, Program } from 'estree'
import * as estree from 'estree-util-visit'
import type { VFile } from 'vfile'

/**
 * Recma plugin that exports `meta` decorated with MDX metadata for React Router routes.
 * This allows layouts to access metadata via `useMatches()`.
 */
export function recmaMdxMeta() {
  return (tree: Program, vfile: VFile) => {
    let metaNode: ExportNamedDeclaration | undefined

    estree.visit(tree, (node) => {
      if (
        node.type === 'ExportNamedDeclaration' &&
        node.declaration?.type === 'VariableDeclaration' &&
        node.declaration.declarations[0]?.id.type === 'Identifier' &&
        node.declaration.declarations[0].id.name === 'meta'
      )
        metaNode = node
    })

    const declaration = metaNode?.declaration
    if (declaration?.type === 'VariableDeclaration') {
      const declarator = declaration.declarations[0]
      if (declarator?.id.type === 'Identifier') declarator.id.name = 'meta_user'
    }

    const filePath = vfile.path
    // TODO: edit url
    const editUrl = `https://github.com/TODO`
    const lastModified = filePath ? fs.statSync(filePath).mtime.toISOString() : undefined

    const { body } = esast.fromJs(
      `
        export const meta = (args) => [
          ...(frontmatter?.title ? [{ title: frontmatter.title }] : []),
          ...(frontmatter?.description ? [{ name: 'description', content: frontmatter.description }] : []),
          ${editUrl ? `{ name: 'edit-url', content: '${editUrl}' },` : ''}
          ${lastModified ? `{ name: 'last-modified', content: '${lastModified}' },` : ''}
          ${metaNode ? `...meta_user(args),` : ''}
        ]
      `,
      { module: true },
    )
    tree.body.push(...body)
  }
}
