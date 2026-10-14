import * as EstreeUtil from 'esast-util-from-js'
import type * as HAst from 'hast'
import { hastToHtml } from 'shiki'
import * as UnistUtil from 'unist-util-visit'
import { isExternal } from './path.js'

/**
 * Rehype plugin that renders static subtrees of code blocks as HTML strings.
 * React development builds retain debug info for every JSX element, so emitting
 * each highlighted token as an element costs hundreds of MB per code-heavy page.
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
        const attributes = toAttributes(node)
        if (!attributes) return
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
        const html = hastToHtml({ type: 'root', children: node.children })
        parent.children[index] = {
          type: 'mdxJsxTextElement',
          name: node.tagName,
          attributes: [
            ...attributes,
            {
              type: 'mdxJsxAttribute',
              name: 'dangerouslySetInnerHTML',
              value: {
                type: 'mdxJsxAttributeValueExpression',
                value: '',
                data: { estree: EstreeUtil.fromJs(`({ __html: ${JSON.stringify(html)} })`) },
              },
            },
          ],
          children: [],
        } as unknown as HAst.Element
        return UnistUtil.SKIP
      })
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

  /** Converts properties to JSX attributes, or returns `undefined` when one needs React casing. */
  function toAttributes(node: HAst.Element) {
    const attributes = []
    for (const [key, value] of Object.entries(node.properties)) {
      if (value === undefined || value === null || value === false) continue
      const name =
        key === 'className' || key === 'class'
          ? 'className'
          : /^(data|aria)-/.test(key)
            ? key
            : /^(data|aria)[A-Z]/.test(key)
              ? key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
              : undefined
      if (!name) return undefined
      attributes.push({
        type: 'mdxJsxAttribute',
        name,
        value: Array.isArray(value) ? value.join(' ') : value === true ? null : String(value),
      })
    }
    return attributes
  }
}
