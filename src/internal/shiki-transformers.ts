import { createCommentNotationTransformer } from '@shikijs/transformers'
import { createTransformerFactory, type TransformerTwoslashOptions } from '@shikijs/twoslash/core'
import type { ShikiTransformer } from '@shikijs/types'
import { createTwoslasher, type TwoslashInstance } from 'twoslash'

type TransformerTwoslashIndexOptions = TransformerTwoslashOptions

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

export function twoslash(options: twoslash.Options = {}): ShikiTransformer {
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
    typesCache = TypesCache.fs(),
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
  export type Options = TransformerTwoslashIndexOptions
}

export function transformerEmptyLine(): ShikiTransformer {
  return {
    name: 'empty-line',
    line(hast) {
      const child = hast.children[0]
      if (child) return
      hast.properties['data-empty-line'] = true
      hast.children = [
        {
          type: 'text',
          value: ' ',
        },
      ]
    },
  }
}

export function transformerTagLine(): ShikiTransformer {
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
