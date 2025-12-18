import { fromJs } from 'esast-util-from-js'
import type { Program } from 'estree'
import { visit } from 'estree-util-visit'

/**
 * Recma plugin that exports a `handle` with metadata for React Router routes.
 * This allows layouts to access metadata via `useMatches()`.
 */
export function recmaMdxMeta() {
  return (tree: Program) => {
    // console.log(generate(tree))

    let hasFrontmatter = false
    visit(tree, (node) => {
      if (
        node.type === 'VariableDeclarator' &&
        node.id.type === 'Identifier' &&
        node.id.name === 'frontmatter'
      ) {
        hasFrontmatter = true
      }
    })
    if (!hasFrontmatter) return

    const handleExport = fromJs('export const handle = { frontmatter }', { module: true })
    tree.body.push(...handleExport.body)
  }
}
