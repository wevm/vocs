import type * as Hast from 'hast'
import type * as Mdast from 'mdast'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

const githubCalloutMap: Record<string, string> = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'info',
  WARNING: 'warning',
  CAUTION: 'danger',
}

const calloutIcons: Record<string, string> = {
  note: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  warning:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  danger:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  tip: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
}

// Elements that should receive the data-v attribute for styling
const dataVElements = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'strong',
  'em',
  'code',
  'pre',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'img',
])

/**
 * Remark plugin that transforms GitHub-style callouts (> [!NOTE]) into callout elements.
 */
function remarkGitHubCallouts() {
  return (tree: Mdast.Root) => {
    visit(tree, 'blockquote', (node: Mdast.Blockquote) => {
      const firstChild = node.children[0]
      if (firstChild?.type !== 'paragraph') return

      const para = firstChild
      const firstInline = para.children[0]
      if (firstInline?.type !== 'text') return

      const match = firstInline.value.match(/^\[!(\w+)\]\s*/)
      if (!match) return

      const calloutType = match[1]
      const variant = calloutType ? githubCalloutMap[calloutType] : undefined
      if (!variant) return

      // Remove the [!TYPE] prefix from the text
      firstInline.value = firstInline.value.slice(match[0].length)

      // If text is now empty, remove it
      if (firstInline.value === '') {
        para.children.shift()
      }

      // Mark this blockquote as a callout
      node.data = {
        hName: 'aside',
        hProperties: {
          'data-v-callout': true,
          'data-v-context': variant,
          'data-v': true,
          'data-v-content': true,
        },
      }
    })
  }
}

/**
 * Rehype plugin that adds data-v attributes for Vocs styling.
 */
function rehypeVocsAttrs() {
  return (tree: Hast.Root) => {
    visit(tree, 'element', (node: Hast.Element) => {
      if (dataVElements.has(node.tagName)) {
        node.properties = { ...node.properties, 'data-v': true }
      }
    })
  }
}

/**
 * Rehype plugin that wraps tables with a wrapper div for overflow handling.
 */
function rehypeTableWrapper() {
  return (tree: Hast.Root) => {
    visit(tree, 'element', (node: Hast.Element, index, parent) => {
      if (node.tagName !== 'table' || index === undefined || !parent) return

      const wrapper: Hast.Element = {
        type: 'element',
        tagName: 'div',
        properties: { 'data-v-table-wrapper': true },
        children: [node],
      }

      ;(parent as Hast.Parent).children[index] = wrapper
      return SKIP
    })
  }
}

/**
 * Rehype plugin that adds icons to callout elements.
 */
function rehypeCalloutIcons() {
  return (tree: Hast.Root) => {
    visit(tree, 'element', (node: Hast.Element) => {
      if (node.tagName !== 'aside' || !node.properties?.['data-v-callout']) return

      const variant = (node.properties['data-v-context'] as string) || 'note'
      const icon = calloutIcons[variant] || calloutIcons['note']

      const iconWrapper: Hast.Element = {
        type: 'element',
        tagName: 'div',
        properties: { 'data-v-callout-icon': true },
        children: [{ type: 'raw', value: icon } as unknown as Hast.ElementContent],
      }

      node.children.unshift(iconWrapper)
    })
  }
}

// Create the unified processor once
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkGitHubCallouts)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeVocsAttrs)
  .use(rehypeTableWrapper)
  .use(rehypeCalloutIcons)
  .use(rehypeStringify, { allowDangerousHtml: true })

/**
 * Converts markdown to HTML string with GFM support (tables, autolinks, etc).
 */
export function toHtml(markdown: string): string {
  if (!markdown) return ''
  return processor.processSync(markdown).toString()
}
