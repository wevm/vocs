import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { TwoslashTypesCache } from '@shikijs/twoslash'

export function fs(options: fs.Options = {}): TwoslashTypesCache {
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

export declare namespace fs {
  export type Options = {
    /**
     * The directory to store the cache files.
     */
    dir?: string
  }
}
