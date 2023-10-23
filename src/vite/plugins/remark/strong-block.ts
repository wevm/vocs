/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

export function remarkStrongBlock() {
  return (tree: Root) => {
    visit(tree, 'strong', (node, _, parent) => {
      if (!parent) return
      if (parent.type !== 'paragraph') return
      if (parent.children.length > 1) return

      parent.type = 'strong' as any
      parent.children = node.children
    })
  }
}
