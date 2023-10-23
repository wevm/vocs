/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root, Yaml } from 'mdast'
import { visit } from 'unist-util-visit'

export function remarkInferFrontmatter() {
  return (tree: Root) => {
    visit(tree, (node, _, parent) => {
      if (parent?.type !== 'root') return

      if (node.type === 'heading' && node.depth === 1) {
        if (node.children.length === 0) return

        const child = node.children[0]
        if (!('value' in child)) return

        const value = child.value
        const [, title, description] = value.includes('[')
          ? value.match(/(.*) \[(.*)\]/) || []
          : [undefined, value]

        const frontmatterIndex = parent.children.findIndex((child) => child.type === 'yaml')
        const index = frontmatterIndex > 0 ? frontmatterIndex : 0

        const frontmatter = {
          ...(parent.children[frontmatterIndex] || {
            value: '',
            type: 'yaml',
          }),
        } as Yaml
        if (!frontmatter.value.includes('title')) frontmatter.value += `\ntitle: ${title}\n`
        if (!frontmatter.value.includes('description'))
          frontmatter.value += `\ndescription: ${description}\n`

        if (frontmatterIndex === -1) tree.children.unshift(frontmatter)
        else parent.children.splice(index, 1, frontmatter)
      }
    })
  }
}
