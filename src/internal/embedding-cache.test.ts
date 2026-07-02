import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as EmbeddingCache from './embedding-cache.js'

let dir: string

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-embed-cache-'))
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('load', () => {
  it('round-trips vectors across loads and counts hits/misses', () => {
    const cache = EmbeddingCache.load({ dir })
    expect(cache.get('a')).toBeUndefined()
    cache.set('a', [1, 2, 3])
    cache.save()
    expect(cache.stats).toEqual({ hits: 0, misses: 1 })

    const reloaded = EmbeddingCache.load({ dir })
    expect(reloaded.get('a')).toEqual([1, 2, 3])
    expect(reloaded.stats).toEqual({ hits: 1, misses: 0 })
  })

  it('prunes entries not touched this build on save', () => {
    const first = EmbeddingCache.load({ dir })
    first.set('stale', [1])
    first.set('kept', [2])
    first.save()

    // Second build only touches `kept` (and adds `fresh`), so `stale` is pruned.
    const second = EmbeddingCache.load({ dir })
    expect(second.get('kept')).toEqual([2])
    second.set('fresh', [3])
    second.save()

    const third = EmbeddingCache.load({ dir })
    expect(third.get('kept')).toEqual([2])
    expect(third.get('fresh')).toEqual([3])
    expect(third.get('stale')).toBeUndefined()
  })

  it('ignore skips reads and writes entirely', () => {
    const cache = EmbeddingCache.load({ dir, ignore: true })
    cache.set('a', [1])
    cache.save()
    expect(fs.readdirSync(dir)).toEqual([])
  })

  it('skips persisting on unwritable filesystems instead of throwing', () => {
    const filePath = path.join(dir, 'not-a-dir')
    fs.writeFileSync(filePath, 'x')
    const cache = EmbeddingCache.load({ dir: path.join(filePath, 'nested') })
    cache.set('a', [1])
    expect(() => cache.save()).not.toThrow()
  })

  it('recovers from a corrupt cache file', () => {
    const cache = EmbeddingCache.load({ dir })
    cache.set('a', [1])
    cache.save()
    const [file] = fs.readdirSync(dir)
    fs.writeFileSync(path.join(dir, file as string), 'not json', 'utf-8')

    const reloaded = EmbeddingCache.load({ dir })
    expect(reloaded.get('a')).toBeUndefined()
  })
})

describe('key', () => {
  const base = {
    adapterType: 'openai',
    model: 'text-embedding-3-small',
    dimensions: undefined,
    chunking: { maxCharacters: 1200 },
    text: 'hello',
  }

  it('is stable for identical input', () => {
    expect(EmbeddingCache.key(base)).toBe(EmbeddingCache.key({ ...base }))
  })

  it('changes when model, dimensions, chunking, or text change', () => {
    const original = EmbeddingCache.key(base)
    expect(EmbeddingCache.key({ ...base, model: 'other' })).not.toBe(original)
    expect(EmbeddingCache.key({ ...base, dimensions: 256 })).not.toBe(original)
    expect(EmbeddingCache.key({ ...base, chunking: { maxCharacters: 800 } })).not.toBe(original)
    expect(EmbeddingCache.key({ ...base, text: 'goodbye' })).not.toBe(original)
  })
})
