/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

export function remarkDetails() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'details') return

      const data = node.data || (node.data = {})
      const tagName = 'details'

      const summaryChild = node.children[0]
      if (summaryChild.type === 'paragraph' && summaryChild.data?.directiveLabel)
        summaryChild.data.hName = 'summary'
      else
        node.children.unshift({
          type: 'paragraph',
          children: [{ type: 'text', value: 'Details' }],
          data: { hName: 'summary' },
        })

      data.hName = tagName
    })
  }
}
