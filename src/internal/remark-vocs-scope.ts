import type * as MdAst from 'mdast'
import * as UnistUtil from 'unist-util-visit'

/**
 * Remark plugin that adds `data-v` attribute to all nodes.
 * This scopes Vocs styles to prevent conflicts with user content.
 */
export function remarkVocsScope() {
  return (tree: MdAst.Root) => {
    UnistUtil.visit(tree, (node) => {
      const n = node as MdAst.Node & { data?: { hProperties?: Record<string, unknown> } }
      n.data ??= {}
      n.data.hProperties ??= {}
      n.data.hProperties['data-v'] = ''
    })
  }
}
