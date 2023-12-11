/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

export function remarkSponsors() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (node.type !== 'leafDirective') return
      if (node.name !== 'sponsors') return
      if (!index) return
      ;(parent?.children[index] as any).children.push({
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { 'data-sponsors': true },
        },
      })
    })
  }
}
