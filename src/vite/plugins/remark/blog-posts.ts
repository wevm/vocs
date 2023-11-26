/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

export function remarkBlogPosts() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type !== 'leafDirective') return
      if (node.name !== 'blog-posts') return

      const data = node.data || (node.data = {})
      data.hName = 'div'
      data.hProperties = { 'data-blog-posts': true }
    })
  }
}
