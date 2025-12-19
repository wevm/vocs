import * as fs from 'node:fs'
import * as esast from 'esast-util-from-js'
import type { ExportNamedDeclaration, Program } from 'estree'
import * as estree from 'estree-util-visit'
import type { VFile } from 'vfile'
import * as Config from '../../../config.js'

/**
 * Recma plugin that exports `meta` decorated with MDX metadata for React Router routes.
 * This allows layouts to access metadata via `useMatches()`.
 */
export function recmaMdxMeta() {
  return (tree: Program, vfile: VFile) => {
    const config = Config.getGlobal()

    let loaderNode: ExportNamedDeclaration | undefined
    let metaNode: ExportNamedDeclaration | undefined

    estree.visit(tree, (node) => {
      if (
        node.type === 'ExportNamedDeclaration' &&
        node.declaration?.type === 'VariableDeclaration' &&
        node.declaration.declarations[0]?.id.type === 'Identifier'
      ) {
        const pattern = node.declaration.declarations[0]?.id
        if (pattern.name === 'meta') metaNode = node
        if (pattern.name === 'loader') loaderNode = node
      }
    })

    const declaration = metaNode?.declaration
    if (declaration?.type === 'VariableDeclaration') {
      const declarator = declaration.declarations[0]
      if (declarator?.id.type === 'Identifier') declarator.id.name = 'meta_user'
    }

    const loaderDeclaration = loaderNode?.declaration
    if (loaderDeclaration?.type === 'VariableDeclaration') {
      const declarator = loaderDeclaration.declarations[0]
      if (declarator?.id.type === 'Identifier') declarator.id.name = 'loader_user'
    }

    const filePath = vfile.path
    const editUrl = 'https://github.com/TODO'
    const lastModified = filePath ? fs.statSync(filePath).mtime.toISOString() : undefined

    const { body } = esast.fromJs(
      `
        import { MdxRoute } from 'vocs/react-router/internal'
        
        export const meta = (args) => {
          const userResult = ${metaNode ? `meta_user?.(args),` : '[]'}
          const mdxResult = MdxRoute.meta({
            config: ${Config.serialize(config)},
            frontmatter,
            ...${JSON.stringify({ editUrl, lastModified })},
          })
          return [...(mdxResult ?? []), ...(userResult ?? [])]
        }

        export const loader = async (args) => {
          const [mdxResult, userResult] = await Promise.all([
            MdxRoute.loader(${JSON.stringify({ content: String(vfile.value) })}),
            ${loaderNode ? `loader_user?.(args),` : 'Promise.resolve({})'}
          ])
          return { ...(mdxResult ?? {}), ...(userResult ?? {}) }
        }
      `,
      { module: true },
    )
    tree.body.push(...body)
  }
}
