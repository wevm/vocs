import { createCommentNotationTransformer } from '@shikijs/transformers'
import { createTransformerFactory, type TransformerTwoslashOptions } from '@shikijs/twoslash/core'
import type { ShikiTransformer } from '@shikijs/types'
import { createTwoslasher, type TwoslashInstance } from 'twoslash'

type TransformerTwoslashIndexOptions = TransformerTwoslashOptions

import * as Snippets from './snippets.js'
import * as Renderer from './twoslash/renderer.js'
import * as TypesCache from './twoslash/types-cache.js'

export {
  transformerNotationDiff as notationDiff,
  transformerNotationFocus as notationFocus,
  transformerNotationHighlight as notationHighlight,
  transformerNotationWordHighlight as notationWordHighlight,
  transformerRemoveNotationEscape as removeNotationEscape,
} from '@shikijs/transformers'

let twoslasher: TwoslashInstance

export function twoslash(options: twoslash.Options): ShikiTransformer {
  const { cacheDir } = options
  const {
    explicitTrigger = true,
    disableTriggers,
    filter,
    includesMap,
    langAlias,
    langs,
    renderer = Renderer.rich(),
    throws = true,
    twoslashOptions,
    typesCache = TypesCache.fs({ dir: cacheDir }),
  } = options

  // singleton twoslasher saves ~1.5s cold start time
  twoslasher ??= createTwoslasher({
    ...twoslashOptions,
    compilerOptions: {
      ...(twoslashOptions?.compilerOptions ?? {}),
      moduleResolution: 100, // bundler,
    },
  })

  return createTransformerFactory(
    twoslasher,
    renderer,
  )({
    explicitTrigger,
    onShikiError() {},
    onTwoslashError() {},
    throws,
    typesCache,
    ...(disableTriggers ? { disableTriggers } : {}),
    ...(filter ? { filter } : {}),
    ...(includesMap ? { includesMap } : {}),
    ...(langAlias ? { langAlias } : {}),
    ...(langs ? { langs } : {}),
  })
}

export declare namespace twoslash {
  export type Options = TransformerTwoslashIndexOptions & { cacheDir?: string | undefined }
}

export function emptyLine(): ShikiTransformer {
  return {
    name: 'empty-line',
    root(hast) {
      // biome-ignore lint/suspicious/noExplicitAny: _
      const code = (hast.children[0] as any)?.children[0]
      if (!code) return
      // biome-ignore lint/suspicious/noExplicitAny: _
      const lines = code.children as any[]
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i]
        if (!line.properties || line.children?.[0]) continue
        line.properties['data-empty-line'] = true
        line.children = [{ type: 'text', value: ' ' }]
      }
    },
  }
}

export function lineNumbers(): ShikiTransformer {
  return createCommentNotationTransformer(
    'vocs:line-numbers',
    /\s*\[!code line-numbers\]/,
    function () {
      this.addClassToHast(this.code, 'line-numbers')
      return true
    },
    'v3',
  )
}

export function tagLine(): ShikiTransformer {
  return {
    name: 'tag-line',
    root(hast) {
      // biome-ignore lint/suspicious/noExplicitAny: _
      const lines = (hast.children[0] as any)?.children[0]?.children
      if (!lines) return

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const classes = line.properties?.class || ''
        if (classes.includes('twoslash-tag-line') && classes.includes('tag-line')) {
          lines.splice(i - 1, 0, line)
          lines.splice(i + 1, 1)
          if (i + 1 === lines.length) lines.splice(i, 1)
        }
      }
    },
  }
}

/**
 * Shiki transformer that adds a title to code blocks.
 */
export function title(): ShikiTransformer {
  return {
    name: 'title',
    root(hast) {
      const titleRegex = /title="(.*)"|\[(.*)\]/
      const titleMatch = this.options.meta?.__raw?.match(titleRegex)
      if (!titleMatch) return

      const title = titleMatch[1] || titleMatch[2]
      // biome-ignore lint/suspicious/noExplicitAny: _
      const child = hast.children[0] as any
      hast.children = [
        {
          ...child,
          properties: {
            ...child.properties,
            'data-title': title,
            ...(this.options.lang && { 'data-v-lang': this.options.lang }),
          },
        },
      ]
    },
  }
}

/**
 * Shiki transformer that processes `// [!include ...]` markers for physical files.
 * Physical files use `~` prefix to indicate root-relative paths.
 */
export function notationInclude(options: notationInclude.Options): ShikiTransformer {
  const { srcDir, rootDir } = options
  const getSource = Snippets.createPhysicalSourceGetter({ srcDir, rootDir })

  return {
    name: 'vocs:notation-include',
    enforce: 'pre',
    preprocess(code) {
      if (!code) return code
      return Snippets.processIncludes({ code, getSource })
    },
  }
}

export declare namespace notationInclude {
  type Options = { srcDir: string; rootDir: string }
}

/**
 * Transformer that detects and renders custom comment tags in code blocks.
 *
 * Detects tag patterns in comments and replaces them with styled tag divs.
 *
 * Supported tags: @error, @log, @warn, @annotate
 *
 * Examples:
 * - // @error: Custom error message
 * - # @log: Custom log message
 * - -- @warn: Custom warning message
 */
export function customTag(): ShikiTransformer {
  const customTags = ['error', 'log', 'warn', 'annotate'] as const
  const tagPattern = new RegExp(`@(${customTags.join('|')}):\\s*(.+)`)

  type Element = import('hast').Element
  type Text = import('hast').Text

  function getTextContent(element: Element): string {
    let text = ''
    for (const child of element.children) {
      if (child.type === 'text') text += child.value
      else if (child.type === 'element') text += getTextContent(child as Element)
    }
    return text
  }

  return {
    name: 'vocs:custom-tag',
    preprocess(code, options) {
      const meta = options.meta?.__raw || ''
      if (meta.includes('twoslash')) return code
      return code
    },
    code(code) {
      const lines = code.children.filter((x) => x.type === 'element') as Element[]
      const tagsToInsert: Array<{ afterIndex: number; type: string; message: string }> = []
      const linesToRemove: Element[] = []

      lines.forEach((line, index) => {
        const lineText = getTextContent(line)
        const match = lineText.match(tagPattern)
        if (!match) return

        const [, tagType, message] = match as [string, string, string]
        tagsToInsert.push({
          afterIndex: index,
          type: tagType,
          message: message.trim(),
        })
        linesToRemove.push(line)
      })

      // remove lines with tags
      for (const line of linesToRemove) {
        const index = code.children.indexOf(line)
        if (index === -1) continue
        const nextLine = code.children[index + 1]
        let removeLength = 1
        // also remove the newline after the line
        if (nextLine?.type === 'text' && nextLine.value === '\n') removeLength = 2
        code.children.splice(index, removeLength)
      }

      // adjust indices for removed lines
      const adjustedTags = tagsToInsert.map((tag) => {
        let adjustedIndex = tag.afterIndex
        for (const removedLine of linesToRemove) {
          const removedIndex = lines.indexOf(removedLine)
          if (removedIndex !== -1 && removedIndex <= tag.afterIndex) adjustedIndex--
        }
        return { ...tag, afterIndex: adjustedIndex }
      })

      // insert tag divs (in reverse order to maintain indices)
      const sortedTags = adjustedTags.sort((a, b) => b.afterIndex - a.afterIndex)

      for (const tag of sortedTags) {
        const currentLines = code.children.filter((x) => x.type === 'element') as Element[]
        const targetLine = currentLines[tag.afterIndex]
        if (!targetLine) continue

        const targetIndex = code.children.indexOf(targetLine)
        if (targetIndex === -1) continue

        const targetClasses = targetLine.properties?.['class']
        const existingClasses = Array.isArray(targetClasses)
          ? targetClasses.filter((x) => typeof x === 'string' && x && !x.startsWith('tag-'))
          : typeof targetClasses === 'string'
            ? targetClasses.split(' ').filter((x) => x && !x.startsWith('tag-'))
            : []

        const tagLine: Element = {
          type: 'element',
          tagName: 'span',
          properties: {
            class: [
              ...existingClasses,
              'line',
              'twoslash-tag-line',
              `twoslash-tag-${tag.type}-line`,
            ],
          },
          children: [{ type: 'text', value: tag.message }],
        }

        // insert after the target line + its newline
        const nextIndex = targetIndex + 1
        if (code.children[nextIndex]?.type === 'text' && code.children[nextIndex]?.value === '\n')
          code.children.splice(nextIndex + 1, 0, tagLine, { type: 'text', value: '\n' } as Text)
        else code.children.splice(nextIndex, 0, tagLine, { type: 'text', value: '\n' } as Text)
      }
    },
  }
}
