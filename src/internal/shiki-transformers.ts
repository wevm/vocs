import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createCommentNotationTransformer } from '@shikijs/transformers'
import type { TwoslashShikiFunction, TwoslashTypesCache } from '@shikijs/twoslash'
import {
  createTransformerFactory,
  rendererRich,
  type TransformerTwoslashIndexOptions,
} from '@shikijs/twoslash'
import type { ShikiTransformer } from '@shikijs/types'
import { createTwoslasher, type TwoslashGenericFunction } from 'twoslash'

export {
  transformerNotationDiff as notationDiff,
  transformerNotationFocus as notationFocus,
  transformerNotationHighlight as notationHighlight,
  transformerNotationWordHighlight as notationWordHighlight,
  transformerRemoveNotationEscape as removeNotationEscape,
} from '@shikijs/transformers'

// We will need to cache the transformer between Vite runs.
let twoslashTransformer: ShikiTransformer | undefined
let twoslasher: TwoslashShikiFunction | TwoslashGenericFunction | undefined

export function twoslash(options: twoslash.Options = {}): ShikiTransformer {
  const {
    explicitTrigger = true,
    disableTriggers,
    filter,
    includesMap,
    langAlias,
    langs,
    renderer = rendererRich({
      // TODO: add custom icons
      completionIcons: false,
      customTagIcons: false,
    }),
    // TODO: default true
    throws = false,
    twoslashOptions,
    typesCache = createFileSystemTypesCache(),
  } = options
  twoslasher ??=
    options.twoslasher ??
    createTwoslasher({
      ...twoslashOptions,
      compilerOptions: {
        ...(twoslashOptions?.compilerOptions ?? {}),
        moduleResolution: 100, // bundler,
      },
    })

  twoslashTransformer ??= createTransformerFactory(
    twoslasher,
    renderer,
  )({
    explicitTrigger,
    onShikiError() {
      // TODO: handling
      // console.error(error)
    },
    onTwoslashError() {
      // TODO: handling
      // console.error(error)
    },
    throws,
    typesCache,
    ...(disableTriggers ? { disableTriggers } : {}),
    ...(filter ? { filter } : {}),
    ...(includesMap ? { includesMap } : {}),
    ...(langAlias ? { langAlias } : {}),
    ...(langs ? { langs } : {}),
  })
  return twoslashTransformer
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

export const transformerTagLine = (): ShikiTransformer => ({
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
})

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

export function createFileSystemTypesCache(
  options: createFileSystemTypesCache.Options = {},
): TwoslashTypesCache {
  const dir = options.dir ?? resolve(import.meta.dirname, '../.cache/twoslash')

  return {
    init() {
      mkdirSync(dir, { recursive: true })
    },
    read(code) {
      const hash = createHash('md5').update(code).digest('hex').slice(0, 12)
      const filePath = join(dir, `${hash}.json`)
      if (!existsSync(filePath)) return null
      return JSON.parse(readFileSync(filePath, { encoding: 'utf-8' }))
    },
    write(code, data) {
      const hash = createHash('md5').update(code).digest('hex').slice(0, 12)
      const filePath = join(dir, `${hash}.json`)
      const json = JSON.stringify(data)
      writeFileSync(filePath, json, { encoding: 'utf-8' })
    },
  }
}

export declare namespace createFileSystemTypesCache {
  export type Options = {
    /**
     * The directory to store the cache files.
     */
    dir?: string
  }
}
