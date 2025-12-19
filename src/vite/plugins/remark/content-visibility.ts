/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import type { Root } from 'mdast'
import { SKIP, visit } from 'unist-util-visit'

const contentTypes = ['md', 'html'] as const
type ContentType = (typeof contentTypes)[number]

/**
 * Filters audience-specific content from an AST.
 *
 * @example
 * ```md
 * :::show[html]
 * This content is only for HTML output.
 * :::
 *
 * :::show[md]
 * This content is only for MD output.
 * :::
 *
 * :::hide[md]
 * This content is hidden for MD output.
 * :::
 *
 * :::hide[html]
 * This content is hidden for HTML output.
 * :::
 * ```
 */
export function filterContentVisibility(tree: Root, contentType: ContentType) {
  visit(tree, 'containerDirective', (node, i, parent) => {
    if (node.name !== 'show' && node.name !== 'hide') return
    if (i === undefined || !parent) return

    const labelChild = node.children.find((child: any) => child.data?.directiveLabel)
    if (!labelChild || labelChild.type !== 'paragraph') return

    const textNode = labelChild.children[0]
    if (textNode?.type !== 'text') return

    const targetType = textNode.value as ContentType
    if (!contentTypes.includes(targetType)) return

    const contentChildren = node.children.filter((child: any) => !child.data?.directiveLabel)

    const shouldShow =
      (node.name === 'show' && targetType === contentType) ||
      (node.name === 'hide' && targetType !== contentType)

    if (shouldShow) {
      parent.children.splice(i, 1, ...contentChildren)
      return [SKIP, i]
    }
    parent.children.splice(i, 1)
    return [SKIP, i]
  })
}

/**
 * Remark plugin to filter audience-specific content at build time.
 * Filters for human audience (HTML output) by default.
 */
export function remarkContentVisibility() {
  return (tree: Root) => filterContentVisibility(tree, 'html')
}
