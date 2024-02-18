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
  let cache = new Map<string, any>()

  let hydrated = false
  function hydrate() {
    const data = fs.readJSONSync(resolve(cacheDir, `${key}.json`), { throws: false })
    if (data) cache = new Map(JSON.parse(data))
    hydrated = true
  }

  function save() {
    fs.ensureDirSync(cacheDir)
    fs.writeJSONSync(resolve(cacheDir, `${key}.json`), JSON.stringify([...cache]))
  }

  return {
    get(key: string) {
      if (!hydrated) hydrate()
      return cache.get(key)
    },
    set<v>(key: string, value: v) {
      if (!hydrated) hydrate()
      cache.set(key, value)
      save()
    },
    delete(key: string) {
      if (!hydrated) hydrate()
      cache.delete(key)
      save()
    },
    clear() {
      cache.clear()
      save()
    },
  }
}

export function clear({
  cacheDir = resolve(__dirname, '../.vocs/cache'),
}: { cacheDir?: string } = {}) {
  if (!fs.existsSync(cacheDir)) return
  fs.rmSync(cacheDir, { recursive: true })
}
