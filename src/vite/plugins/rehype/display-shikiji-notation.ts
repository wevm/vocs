/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

export function rehypeShikijiDisplayNotation() {
  return (tree: Root) => {
    visit(tree, 'text', (node) => {
      if (node.value.startsWith('//$')) node.value = node.value.replace('//$', '//')
    })
  }
}
