/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import { h } from 'hastscript'
import type { BlockContent, DefinitionContent, Root } from 'mdast'
import { visit } from 'unist-util-visit'

export function remarkCodeGroup() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective') return
      if (node.name !== 'code-group') return

      const data = node.data || (node.data = {})
      const tagName = 'div'

      node.attributes = {
        ...node.attributes,
        class: 'code-group',
      }

      data.hName = tagName
      data.hProperties = h(tagName, node.attributes || {}).properties

      node.children = node.children
        .map((child) => {
          const match = 'meta' in child && child?.meta?.match(/\[(.*)\]/)
          return {
            type: 'paragraph',
            children: [child],
            data: {
              hName: 'div',
              hProperties: match
                ? {
                    'data-title': match[1],
                  }
                : undefined,
            },
          }
        })
        .filter(Boolean) as (BlockContent | DefinitionContent)[]
    })
  }
}
