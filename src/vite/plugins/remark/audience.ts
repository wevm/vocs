/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * Remark plugin to filter audience-specific content at build time.
 *
 * For HTML output (default):
 * - Removes `:::agent-only` content (only for AI agents)
 * - Unwraps `:::human-only` content (keeps children, removes wrapper)
 */
export function remarkAudience() {
  return (tree: Root) => {
    visit(tree, 'containerDirective', (node: any, i, parent: any) => {
      if (!parent || typeof i !== 'number') return
      if (node.name !== 'agent-only' && node.name !== 'human-only') return

      if (node.name === 'agent-only') {
        // Remove agent-only content from HTML output
        parent.children.splice(i, 1)
        return i // Revisit this index since we removed an element
      }

      if (node.name === 'human-only') {
        // Unwrap human-only content (keep children, remove wrapper)
        parent.children.splice(i, 1, ...node.children)
        return i // Revisit this index
      }
    })
  }
}
