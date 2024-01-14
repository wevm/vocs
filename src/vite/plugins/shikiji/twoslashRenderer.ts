import type { Element } from 'hast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { defaultHandlers, toHast } from 'mdast-util-to-hast'
import type { ShikijiTransformerContextCommon } from 'shikiji'
import type { TwoSlashRenderer } from 'shikiji-twoslash'

export function twoslashRenderer(): TwoSlashRenderer {
  function hightlightPopupContent(
    codeToHast: ShikijiTransformerContextCommon['codeToHast'],
    shikijiOptions: ShikijiTransformerContextCommon['options'],
    info: { text?: string; docs?: string },
  ) {
    if (!info.text) return []

    const text = processHoverInfo(info.text) ?? info.text
    if (!text.trim()) return []

    const themedContent = (
      (
        codeToHast(text, {
          ...shikijiOptions,
          transformers: [],
        }).children[0] as Element
      ).children[0] as Element
    ).children

    if (info.docs) {
      const santized = info.docs
        .replace(/\n?{(@.*)?\s*\n?/g, '')
        .replace(/\s*}\n?/g, '')
        .replace(/(.)\n(.)/g, '$1 $2')
        .replace(/\n?-\s/g, '\n')
      const mdast = fromMarkdown(santized, {
        mdastExtensions: [gfmFromMarkdown()],
      })
      const hast = toHast(mdast, {
        handlers: {
          code: (state, node) => {
            const lang = node.lang || ''
            if (lang) {
              return codeToHast(node.value, {
                ...shikijiOptions,
                transformers: [],
                lang,
              }).children[0] as Element
            }
            return defaultHandlers.code(state, node)
          },
        },
      }) as Element
      if (info.docs) {
        themedContent.push({
          type: 'element',
          tagName: 'div',
          properties: { class: 'twoslash-popup-jsdoc' },
          children: hast.children,
        })
      }
    }

    return themedContent
  }

  return {
    nodeStaticInfo(info, node) {
      const themedContent = hightlightPopupContent(this.codeToHast, this.options, info)

      if (!themedContent.length) return node

      return {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-hover',
        },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {
              class: 'twoslash-popup-info-hover',
            },
            children: [
              {
                type: 'element',
                tagName: 'div',
                properties: { class: 'twoslash-popup-arrow' },
                children: [],
              },
              {
                type: 'element',
                tagName: 'div',
                properties: { class: 'twoslash-popup-scroll-container' },
                children: themedContent,
              },
            ],
          },
          {
            type: 'element',
            tagName: 'span',
            properties: {
              class: 'twoslash-target',
            },
            children: [node],
          },
        ],
      }
    },

    nodeQuery(info, node) {
      if (!info.text) return {}

      const themedContent = hightlightPopupContent(this.codeToHast, this.options, info)

      return {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-query-presisted',
        },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: {
              class: 'twoslash-popup-info',
            },
            children: [
              {
                type: 'element',
                tagName: 'div',
                properties: { class: 'twoslash-popup-arrow' },
                children: [],
              },
              ...themedContent,
            ],
          },
          node,
        ],
      }
    },

    nodeCompletion(query, node) {
      if (node.type !== 'text')
        throw new Error(
          `[shikiji-twoslash] nodeCompletion only works on text nodes, got ${node.type}`,
        )

      const leftPart = query.completionsPrefix || ''
      const rightPart = node.value.slice(leftPart.length || 0)

      return {
        type: 'element',
        tagName: 'span',
        properties: {},
        children: [
          node.value.trim().length > 0
            ? {
                type: 'text',
                value: leftPart,
              }
            : undefined,
          {
            type: 'element',
            tagName: 'span',
            properties: {
              class: 'twoslash-completions-list',
            },
            children: [
              {
                type: 'element',
                tagName: 'ul',
                properties: {},
                children: query
                  .completions!.filter((i) => i.name.startsWith(query.completionsPrefix || '____'))
                  .map((i) => ({
                    type: 'element',
                    tagName: 'li',
                    properties: {},
                    children: [
                      {
                        type: 'element',
                        tagName: 'span',
                        properties: {
                          class: i.kindModifiers?.split(',').includes('deprecated')
                            ? 'deprecated'
                            : undefined,
                        },
                        children: [
                          {
                            type: 'element',
                            tagName: 'span',
                            properties: { class: 'twoslash-completions-matched' },
                            children: [
                              {
                                type: 'text',
                                value: query.completionsPrefix || '',
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
                                value: i.name.slice(query.completionsPrefix?.length || 0),
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  })),
              },
            ],
          },
          {
            type: 'text',
            value: rightPart,
          },
        ].filter(Boolean) as any,
      }
    },

    nodeError(_, node) {
      return {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-error',
        },
        children: [node],
      }
    },

    lineError(error) {
      return [
        {
          type: 'element',
          tagName: 'div',
          properties: {
            class: 'twoslash-meta-line twoslash-error-line',
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
  }
}

const regexType = /^[A-Z][a-zA-Z0-9_]*(\<[^\>]*\>)?:/
const regexFunction = /^[a-zA-Z0-9_]*\(/

/**
 * The default hover info processor, which will do some basic cleanup
 */
export function processHoverInfo(type: string) {
  let content = type
    // remove leading `(property)` or `(method)` on each line
    .replace(/^\(([\w-]+?)\)\s+/gm, '')
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
