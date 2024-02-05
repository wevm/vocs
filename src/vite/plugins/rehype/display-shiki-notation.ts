/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

export function rehypeShikiDisplayNotation() {
  return (tree: Root) => {
    visit(tree, 'text', (node) => {
      if (node.value.includes('//$')) node.value = node.value.replace('//$', '//')
    })
  }
}
