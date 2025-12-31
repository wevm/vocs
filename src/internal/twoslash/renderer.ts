import { ShikiTwoslashError, type TwoslashRenderer } from '@shikijs/twoslash/core'
import type { ShikiTransformerContextCommon } from '@shikijs/types'
import type { Element, ElementContent } from 'hast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { defaultHandlers, toHast } from 'mdast-util-to-hast'
import type { NodeError, NodeHover, NodeQuery } from 'twoslash'
import { remarkMdScope } from '../mdx.js'

/**
 * An alternative renderer that providers better prefixed class names,
 * with syntax highlight for the info text.
 */
export function rich(): TwoslashRenderer {
  function getPopupContent(
    this: ShikiTransformerContextCommon,
    info: NodeHover | NodeQuery,
  ): ElementContent[] {
    if (!info.text) return []
    const content = processHoverInfo(info.text)
    if (!content || content === 'any') return []

    const popupContents: ElementContent[] = []

    let lang = this.options.lang
    if (lang === 'jsx') lang = 'tsx'
    else if (lang === 'js' || lang === 'javascript') lang = 'ts'

    popupContents.push({
      type: 'element',
      tagName: 'pre',
      properties: {
        class: 'twoslash-popup-code',
        'data-code': content,
        'data-codeToHtml': true,
        'data-lang': lang,
      },
      children: [],
    })

    if (info.docs) {
      const docs = processHoverDocs(info.docs)

      const mdast = fromMarkdown(docs, {
        mdastExtensions: [gfmFromMarkdown()],
      })
      remarkMdScope()(mdast)

      const hast = toHast(mdast, {
        handlers: {
          code: (state, node) => {
            const lang = node.lang || ''
            if (lang) {
              return {
                type: 'element',
                tagName: 'pre',
                properties: {
                  'data-code': node.value,
                  'data-codeToHtml': true,
                  'data-lang': lang,
                },
                children: [],
              }
            }
            return defaultHandlers.code(state, node)
          },
        },
      }) as Element

      popupContents.push({
        type: 'element',
        tagName: 'div',
        properties: { class: 'twoslash-popup-docs', 'data-overflow-fade': true },
        children: [
          ...hast.children,
          {
            type: 'element',
            tagName: 'div',
            properties: { 'data-overflow-sentinel': true },
            children: [],
          },
        ],
      })
    }

    // TODO: render `info.tags`

    return popupContents
  }

  return {
    lineError(error) {
      function getErrorLevelClass(error: NodeError): string {
        switch (error.level) {
          case 'warning':
            return 'twoslash-error-level-warning'
          case 'suggestion':
            return 'twoslash-error-level-suggestion'
          case 'message':
            return 'twoslash-error-level-message'
          default:
            return ''
        }
      }

      return [
        {
          type: 'element',
          tagName: 'div',
          properties: {
            class: ['twoslash-meta-line twoslash-error-line', getErrorLevelClass(error)]
              .filter(Boolean)
              .join(' '),
          },
          children: [
            {
              type: 'text',
              value: error.text,
            },
          ],
        },
      ]
    },

    nodeStaticInfo(info, node) {
      const content = getPopupContent.call(this, info)

      if (!content.length) return node

      return {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-hover twoslash-popup-container',
        },
        children: [node, ...content],
      }
    },

    nodeQuery(query, node) {
      if (!query.text) return {}

      const content = getPopupContent.call(this, query)

      return {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-hover twoslash-query-persisted twoslash-popup-container',
        },
        children: [node, ...content],
      }
    },

    nodeCompletion(query, node) {
      if (node.type !== 'text')
        throw new ShikiTwoslashError(
          `Renderer hook nodeCompletion only works on text nodes, got ${node.type}`,
        )

      const items: Element[] = query.completions.map((i) => {
        const isDeprecated =
          'kindModifiers' in i &&
          typeof i.kindModifiers === 'string' &&
          i.kindModifiers?.split(',').includes('deprecated')
        return {
          type: 'element',
          tagName: 'li',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'span',
              properties: {
                class: isDeprecated ? 'deprecated' : undefined,
              },
              children: [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: 'twoslash-completions-matched' },
                  children: [
                    {
                      type: 'text',
                      value: i.name.startsWith(query.completionsPrefix)
                        ? query.completionsPrefix
                        : '',
                    },
                  ],
                },
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { class: 'twoslash-completions-unmatched' },
                  children: [
                    {
                      type: 'text',
                      value: i.name.startsWith(query.completionsPrefix)
                        ? i.name.slice(query.completionsPrefix.length || 0)
                        : i.name,
                    },
                  ],
                },
              ],
            },
          ],
        }
      })

      const children: ElementContent[] = []

      if (node.value) children.push({ type: 'text', value: node.value })

      children.push({
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-completion-cursor',
        },
        children: [
          {
            type: 'element',
            tagName: 'ul',
            properties: {
              class: 'twoslash-completion-list',
            },
            children: items,
          },
        ],
      })

      return {
        type: 'element',
        tagName: 'span',
        properties: {},
        children,
      }
    },

    lineCustomTag(tag) {
      return [
        {
          type: 'element',
          tagName: 'div',
          properties: {
            class: `twoslash-tag-line twoslash-tag-${tag.name}-line`,
          },
          children: [
            {
              type: 'text',
              value: tag.text || '',
            },
          ],
        },
      ]
    },

    nodesHighlight(_, nodes) {
      return [
        {
          type: 'element',
          tagName: 'span',
          properties: {
            class: 'twoslash-highlighted',
          },
          children: nodes,
        },
      ]
    },
  }
}

const regexType = /^[A-Z]\w*(<[^>]*>)?:/
const regexFunction = /^\w*\(/

/**
 * The default hover info processor, which will do some basic cleanup
 */
function processHoverInfo(type: string): string {
  let content = type
    // remove leading `(property)` or `(method)` on each line
    .replace(/^\(([\w-]+)\)\s+/gm, '')
    // remove import statement
    .replace(/\nimport .*$/, '')
    // remove interface or namespace lines with only the name
    .replace(/^(interface|namespace) \w+$/gm, '')
    .trim()

  // Add `type` or `function` keyword if needed
  if (content.match(regexType)) content = `type ${content}`
  else if (content.match(regexFunction)) content = `function ${content}`

  return content
}

function processHoverDocs(docs: string): string {
  return (
    docs
      // Remove inline JSDoc tags like {@link}
      .replace(/\{@\w+\s+[^}]*\}/g, '')
      .trim()
  )
}
