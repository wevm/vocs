import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { default as fs } from 'fs-extra'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const search = create('search')
export const twoslash = create('twoslash')

export function create(
  key: string,
  { cacheDir = resolve(__dirname, '../.vocs/cache') }: { cacheDir?: string } = {},
) {
  const pathname = (k: string) => resolve(cacheDir, `${key}${k ? `.${k}` : ''}.json`)
  return {
    get(k: string) {
      let data = fs.readJSONSync(pathname(k), { throws: false })
      data = JSON.parse(data ?? '{}')
      return data.value
    },
    set<v>(k: string, value: v) {
      fs.ensureDirSync(cacheDir)
      fs.writeJSONSync(pathname(k), JSON.stringify({ value }))
    },
  }
}

export function clear({
  cacheDir = resolve(__dirname, '../.vocs/cache'),
}: { cacheDir?: string } = {}) {
  if (!fs.existsSync(cacheDir)) return
  fs.rmSync(cacheDir, { recursive: true })
}
