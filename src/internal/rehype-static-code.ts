import * as EstreeUtil from 'esast-util-from-js'
import type * as HAst from 'hast'
import { hastToHtml } from 'shiki'
import * as UnistUtil from 'unist-util-visit'
import { isExternal } from './path.js'

/**
 * Rehype plugin that keeps code blocks cheap for React development builds, which
 * retain debug info per JSX call site. Code block contents render through one
 * `CodeTree` call site, and static subtrees render as HTML strings.
 */
export function rehypeStaticCode() {
  // Markers that `components.div` renders as other components.
  const componentDivs =
    /^data-?v-?(benchmarks|changelog|code-?group|file-?tree|mermaid-?chart|steps|terminal)$/i

  return (tree: HAst.Root) => {
    UnistUtil.visit(tree, 'element', (pre) => {
      if (pre.tagName !== 'pre') return
      UnistUtil.visit(pre, 'element', (node, index, parent) => {
        if (node === pre || !parent || index === undefined) return
        if (!isStatic(node)) return
        // A leaf element gains nothing from becoming an HTML string.
        if (!node.children.some((child) => child.type === 'element')) return UnistUtil.SKIP
        UnistUtil.visit(node, 'element', (child) => {
          // Matches what `components.a` and `Link` render for external URLs.
          if (child.tagName === 'a')
            Object.assign(child.properties, {
              'data-v-link': true,
              'data-v': true,
              rel: 'noopener noreferrer',
              target: '_blank',
            })
          // React renders `true` data and ARIA attributes as "true", not as empty strings.
          for (const [key, value] of Object.entries(child.properties))
            if (value === true && /^(data|aria)([A-Z]|-)/.test(key)) child.properties[key] = 'true'
        })
        parent.children[index] = {
          type: 'element',
          // Rendered by `CodeTree` (see `src/react/internal/CodeTree.mdx.tsx`).
          tagName: 'vocs-static-html',
          properties: {
            ...node.properties,
            tag: node.tagName,
            html: hastToHtml({ type: 'root', children: node.children }),
          },
          children: [],
        }
        return UnistUtil.SKIP
      })
      // MDX keeps the `pre` itself, since parents such as `CodeGroup` read its props.
      const root: HAst.Root = { type: 'root', children: pre.children }
      if (!isHast(root)) return UnistUtil.SKIP
      UnistUtil.visit(root, (node) => {
        delete node.position
      })
      pre.children = [
        {
          type: 'mdxJsxFlowElement',
          name: 'VocsCodeTree',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'tree',
              value: {
                type: 'mdxJsxAttributeValueExpression',
                value: '',
                // One string literal keeps the module small: MDX prints an object literal one
                // property per line, and Vite source-maps every token of it.
                data: {
                  estree: EstreeUtil.fromJs(`JSON.parse(${JSON.stringify(JSON.stringify(root))})`),
                },
              },
            },
          ],
          children: [],
        } as unknown as HAst.ElementContent,
      ]
      return UnistUtil.SKIP
    })
  }

  /** Whether the subtree renders the same without MDX components (see `src/mdx.tsx`). */
  function isStatic(node: HAst.ElementContent): boolean {
    if (node.type === 'text') return true
    if (node.type !== 'element') return false
    if (node.tagName === 'a' && !isExternal(String(node.properties['href'] ?? ''))) return false
    if (['aside', 'pre', 'table'].includes(node.tagName)) return false
    if (
      node.tagName === 'div' &&
      Object.keys(node.properties).some((key) => componentDivs.test(key))
    )
      return false
    // `components.code` adds `data-v`, and `components.span` renders Twoslash popups.
    if (node.tagName === 'code' && !('data-v' in node.properties || 'dataV' in node.properties))
      return false
    if (node.tagName === 'span' && /\btwoslash-(hover|completion-cursor)\b/.test(classes(node)))
      return false
    return node.children.every(isStatic)
  }

  // Shiki writes `class` strings, while other plugins write `className` arrays.
  function classes(node: HAst.Element) {
    const value = node.properties['className'] ?? node.properties['class']
    return Array.isArray(value) ? value.join(' ') : String(value ?? '')
  }

  /** Whether the tree holds only nodes that `hast-util-to-jsx-runtime` can render. */
  function isHast(node: HAst.Root | HAst.RootContent): boolean {
    if (node.type === 'text' || node.type === 'comment') return true
    if (node.type !== 'element' && node.type !== 'root') return false
    return node.children.every(isHast)
  }
}
