import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { TwoslashShikiFunction, TwoslashTypesCache } from '@shikijs/twoslash'
import {
  createTransformerFactory,
  rendererClassic,
  type TransformerTwoslashIndexOptions,
} from '@shikijs/twoslash'
import type { ShikiTransformer } from '@shikijs/types'
import { createTwoslasher, type TwoslashGenericFunction } from 'twoslash'

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
    renderer = rendererClassic(),
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

export interface FileSystemTypeResultCacheOptions {
  /**
   * The directory to store the cache files.
   */
  dir?: string
}

export function createFileSystemTypesCache(
  options: FileSystemTypeResultCacheOptions = {},
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
