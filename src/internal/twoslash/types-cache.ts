import * as crypto from 'node:crypto'
import * as node_fs from 'node:fs'
import * as path from 'node:path'
import type { TwoslashTypesCache } from '@shikijs/twoslash'

export function fs(options: fs.Options): TwoslashTypesCache {
  const { dir = path.resolve(import.meta.dirname, '../../.vocs/cache/twoslash') } = options

  return {
    init() {
      node_fs.mkdirSync(dir, { recursive: true })
    },
    read(code) {
      const hash = crypto.createHash('md5').update(code).digest('hex').slice(0, 12)
      const filePath = path.join(dir, `${hash}.json`)
      if (!node_fs.existsSync(filePath)) return null
      return JSON.parse(node_fs.readFileSync(filePath, { encoding: 'utf-8' }))
    },
    write(code, data) {
      const hash = crypto.createHash('md5').update(code).digest('hex').slice(0, 12)
      const filePath = path.join(dir, `${hash}.json`)
      const json = JSON.stringify(data)
      node_fs.writeFileSync(filePath, json, { encoding: 'utf-8' })
    },
  }
}

export declare namespace fs {
  export type Options = {
    /**
     * The directory to store the cache files.
     */
    dir?: string | undefined
  }
}
