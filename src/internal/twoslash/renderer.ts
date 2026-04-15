import { ShikiTwoslashError, type TwoslashRenderer } from '@shikijs/twoslash/core'
import type { ShikiTransformerContextCommon } from '@shikijs/types'
import type { Element, ElementContent } from 'hast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { defaultHandlers, toHast } from 'mdast-util-to-hast'
import { hastToHtml } from 'shiki'
import type { NodeError, NodeHover, NodeQuery } from 'twoslash'
import { remarkVocsScope } from '../remark-vocs-scope.js'

/**
 * Default patterns for detecting markdown content inside code blocks.
 * Used to fix unclosed fenced code blocks in doc comments.
 */
export const defaultMarkdownPatterns: RegExp[] = [
  /^#{1,6}\s+\S/, // Headings
  /^\*\*\w/, // Bold at start
  /^>\s/, // Blockquote
]

/**
 * Patterns for Rust doc comments.
 * Rust uses `# ` to hide code lines (e.g., `# use std::io;`), so we must
 * only match headings that start with uppercase letters to avoid false positives.
 */
export const rustMarkdownPatterns: RegExp[] = [
  /^#{1,6}\s+[A-Z]/, // Headings (must start with uppercase letter)
  /^\*\*[A-Z]/, // Bold at start (must start with uppercase letter)
  /^>\s/, // Blockquote
]

export type PopupPayload = {
  codeHtml?: string | undefined
  docsHtml?: string | undefined
}

/**
 * An alternative renderer that providers better prefixed class names,
 * with syntax highlight for the info text.
 */
export function rich(options: rich.Options = {}): TwoslashRenderer {
  const { markdownPatterns = defaultMarkdownPatterns } = options

  function getPopupPayload(
    this: ShikiTransformerContextCommon,
    info: NodeHover | NodeQuery,
  ): PopupPayload | undefined {
    if (!info.text) return undefined

    // Rust twoslash combines code and docs in `text` separated by `---`
    // Split them so docs can be rendered as markdown
    const { code: extractedCode, docs: extractedDocs } = splitCodeAndDocs(info.text)

    const content = processHoverInfo(extractedCode)
    if (!content || content === 'any') return undefined

    let lang = this.options.lang
    if (lang === 'jsx') lang = 'tsx'
    else if (lang === 'js' || lang === 'javascript') lang = 'ts'

    const codeHast = this.codeToHast(content, {
      ...this.options,
      defaultColor: 'light-dark()',
      lang,
      meta: { 'data-v-overflow-fade': true },
      rootStyle: false,
      structure: 'classic',
      transformers: [],
    })

    const codePre = codeHast.children[0]
    if (codePre?.type === 'element' && codePre.tagName === 'pre') {
      codePre.properties = {
        ...codePre.properties,
        class: mergeClasses(codePre.properties?.['class'], 'twoslash-popup-code'),
      }
      codePre.children.push({
        type: 'element',
        tagName: 'div',
        properties: { 'data-v-overflow-sentinel': true },
        children: [],
      })
    }

    const payload: PopupPayload = {
      codeHtml: hastToHtml(codeHast),
    }

    // Use extracted docs from text (Rust) or explicit docs field (TypeScript)
    // Also reconstruct docs from spurious tags that were incorrectly parsed
    // (e.g., `@vocs/package` in inline code gets split as tag @vocs with text /package)
    const rawDocs = reconstructDocs(extractedDocs || info.docs, info.tags)
    if (rawDocs) {
      const docs = processHoverDocs(rawDocs, markdownPatterns)

      const mdast = fromMarkdown(docs, {
        mdastExtensions: [gfmFromMarkdown()],
      })
      remarkVocsScope()(mdast)

      const hast = toHast(mdast, {
        handlers: {
          code: (state, node) => {
            const lang = node.lang || ''
            if (lang) {
              return {
                type: 'element',
                tagName: 'pre',
                properties: {
                  'data-v-code': node.value,
                  'data-v-codeToHtml': true,
                  'data-v-lang': lang,
                },
                children: [],
              }
            }
            return defaultHandlers.code(state, node)
          },
          inlineCode: (state, node) => {
            const result = defaultHandlers.inlineCode(state, node)
            result.properties['data-v'] = true
            return result
          },
        },
      }) as Element

      payload.docsHtml = hastToHtml({
        type: 'element',
        tagName: 'div',
        properties: { class: 'twoslash-popup-docs', 'data-v-overflow-fade': true },
        children: [
          ...hast.children,
          {
            type: 'element',
            tagName: 'div',
            properties: { 'data-v-overflow-sentinel': true },
            children: [],
          },
        ],
      })
    }

    return payload
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
      const payload = getPopupPayload.call(this, info)

      if (!payload) return node

      return {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-hover twoslash-popup-container',
          'data-v-twoslash-code-html': payload.codeHtml,
          'data-v-twoslash-docs-html': payload.docsHtml,
        },
        children: [node],
      }
    },

    nodeQuery(query, node) {
      if (!query.text) return {}

      const payload = getPopupPayload.call(this, query)

      if (!payload) return node

      return {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'twoslash-hover twoslash-query-persisted twoslash-popup-container',
          'data-v-twoslash-code-html': payload.codeHtml,
          'data-v-twoslash-docs-html': payload.docsHtml,
        },
        children: [node],
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

/**
 * Reconstruct docs by:
 * 1. Merging back spurious tags that were incorrectly parsed (e.g., scoped npm packages)
 * 2. Appending @example tag content to the docs
 *
 * TypeScript's JSDoc parser incorrectly splits scoped npm package names like
 * `@vocs/twoslash-rust` into a tag `@vocs` with text `/twoslash-rust`.
 * This function detects such spurious tags and merges them back into the docs.
 *
 * A tag is considered spurious if:
 * 1. Its text starts with `/` (indicating scoped package continuation)
 * 2. It's not a known JSDoc tag name (example, param, returns, etc.)
 */
export function reconstructDocs(
  docs: string | undefined,
  tags: [name: string, text: string | undefined][] | undefined,
): string | undefined {
  if (!tags?.length) return docs

  // Known JSDoc tags that should not be merged back as spurious
  const knownTags = new Set([
    'example',
    'param',
    'returns',
    'return',
    'throws',
    'see',
    'since',
    'deprecated',
    'default',
    'type',
    'typedef',
    'property',
    'template',
    'link',
    'internal',
    'public',
    'private',
    'protected',
    'readonly',
    'override',
    'virtual',
    'abstract',
    'experimental',
    'beta',
    'alpha',
  ])

  let result = docs ?? ''

  for (const [name, text] of tags) {
    // Spurious tag: not a known tag AND text starts with /
    if (!knownTags.has(name) && text?.startsWith('/')) {
      result += `@${name}${text}`
    }
    // Append @example content
    // FIXME: TypeScript's JSDoc parser strips indentation from @example content.
    // A future improvement could restore indentation, but this is complex for
    // multiple languages with different syntax (braces, indentation-based, etc.)
    else if (name === 'example' && text) {
      result += `\n\n**Example**\n\n${text}`
    }
  }

  return result || undefined
}

function processHoverDocs(docs: string, markdownPatterns: RegExp[]): string {
  let processed = docs
    // Remove inline JSDoc tags like {@link}
    .replace(/\{@\w+\s+[^}]*\}/g, '')
    // Convert Rust-style reference links [`Foo`] to inline links if URL follows
    // e.g., [`Provider`](url) is already valid markdown
    // but [`Provider`] alone should become `Provider` (code only, no broken link)
    .replace(/\[`([^`]+)`\](?!\()/g, '`$1`')
    .trim()

  // Fix malformed fenced code blocks that may have unclosed blocks
  processed = fixUnclosedCodeBlocks(processed, markdownPatterns)

  return processed
}

function mergeClasses(existing: unknown, next: string): string {
  const classes = Array.isArray(existing)
    ? existing.flatMap((value) => String(value).split(' '))
    : typeof existing === 'string'
      ? existing.split(' ')
      : []

  return [...classes.filter(Boolean), next].join(' ')
}

/**
 * Fix unclosed fenced code blocks in markdown.
 * Some doc comments have malformed code blocks where:
 * 1. A code block opens with ```lang but never closes
 * 2. Markdown content (headings, bold text) appears inside what should be closed blocks
 * 3. A new code block starts without closing the previous one
 *
 * This function detects markdown syntax inside code blocks and closes them appropriately.
 */
function fixUnclosedCodeBlocks(markdown: string, markdownPatterns: RegExp[]): string {
  const lines = markdown.split('\n')
  const result: string[] = []
  let inCodeBlock = false

  for (const line of lines) {
    const fenceMatch = line.match(/^```(\w*)/)

    if (fenceMatch) {
      if (inCodeBlock) {
        if (fenceMatch[1]) {
          // New code block starting while already in one - close the previous first
          result.push('```')
        }
        // Either way, we're toggling the code block state
        inCodeBlock = !!fenceMatch[1]
      } else {
        // Starting a new code block
        inCodeBlock = !!fenceMatch[1]
      }
      result.push(line)
      continue
    }

    // If we're in a code block, check if this line looks like markdown
    if (inCodeBlock && markdownPatterns.some((pattern) => pattern.test(line))) {
      // This looks like markdown content, close the code block first
      result.push('```')
      inCodeBlock = false
    }

    result.push(line)
  }

  // If still in a code block at the end, close it
  if (inCodeBlock) {
    result.push('```')
  }

  return result.join('\n')
}

/**
 * Split Rust twoslash text that combines code and docs with `---` separator.
 * Returns the code part and optional docs part.
 */
function splitCodeAndDocs(text: string): { code: string; docs: string | undefined } {
  // Look for `---` on its own line (Rust twoslash format)
  const separatorMatch = text.match(/\n---\n/)
  if (separatorMatch && separatorMatch.index !== undefined) {
    const code = text.slice(0, separatorMatch.index).trim()
    const docs = text.slice(separatorMatch.index + separatorMatch[0].length).trim()
    return { code, docs: docs || undefined }
  }
  return { code: text, docs: undefined }
}

export declare namespace rich {
  export type Options = {
    /**
     * Patterns to detect markdown content inside unclosed code blocks.
     * When a line inside a fenced code block matches one of these patterns,
     * the code block will be closed before that line.
     *
     * @default defaultMarkdownPatterns
     */
    markdownPatterns?: RegExp[] | undefined
  }
}
