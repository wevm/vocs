/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

export function remarkCode() {
  return (tree: Root) => {
    visit(tree, (node, _, parent) => {
      if (node.type !== 'code') return
      if (!node.lang) node.lang = 'txt'
      if (parent?.type === 'containerDirective' && parent.name !== 'steps') return

      const [match, title] = node.meta?.match(/\[(.*)\]/) || []
      if (match) node.meta = node.meta?.replace(match, `title=\"${title}\"`)
    })
  }
}
