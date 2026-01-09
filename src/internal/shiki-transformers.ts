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
  const { rootDir } = options
  const getSource = Snippets.createPhysicalSourceGetter({ rootDir })

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
  type Options = { rootDir: string }
}
