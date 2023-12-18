import type { Element } from 'hast'
import type { TwoSlashRenderers } from 'shikiji-twoslash'

export function twoslashRenderer(): TwoSlashRenderers {
  return {
    nodeStaticInfo(info, node) {
      const text = info.text.match(/.{1,60}/g)

      const themedContent = (
        (
          this.codeToHast(text?.join('\n')!, {
            ...this.options,
            transformers: [],
            transforms: undefined,
          }).children[0] as Element
        ).children[0] as Element
      ).children

      return {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-hover',
        },
        children: [
          node,
          {
            type: 'element',
            tagName: 'span',
            properties: {
              class: 'twoslash-popup-info',
            },
            children: themedContent,
          },
        ],
      }
    },

    nodeQuery(query, node) {
      if (!query.text) return {}

      const themedContent = (
        (
          this.codeToHast(query.text, {
            ...this.options,
            transformers: [],
            transforms: undefined,
          }).children[0] as Element
        ).children[0] as Element
      ).children

      return {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-hover twoslash-query-presisted',
        },
        children: [
          node,
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
        ],
      }
    },

    nodeCompletions(query, node) {
      if (node.type !== 'text')
        throw new Error(
          `[shikiji-twoslash] nodeCompletions only works on text nodes, got ${node.type}`,
        )

      const leftPart = query.completionsPrefix || ''
      const rightPart = node.value.slice(leftPart.length || 0)

      return {
        type: 'element',
        tagName: 'span',
        properties: {},
        children: [
          {
            type: 'text',
            value: leftPart,
          },
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
        ],
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
              value: error.renderedMessage,
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
          properties: { class: `twoslash-tag-line twoslash-tag-${tag.name}-line` },
          children: [
            {
              type: 'text',
              value: tag.annotation || '',
            },
          ],
        },
      ]
    },
  }
}
