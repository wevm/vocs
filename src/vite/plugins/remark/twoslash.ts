/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

export function remarkTwoslash() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (node.type === 'code') {
        // Add extra new lines between multiple twoslash annotations (@log, @error, etc)
        // so that they can render correctly.
        node.value = node.value
          .replace(/(\/\/\s@.*:\s.*)\n(\/\/)/g, '$1\n\n$2')
          .replace(/(\/\/\s@.*:\s.*)\n(\/\/)/g, '$1\n\n$2')
      }
    })
  }
}
