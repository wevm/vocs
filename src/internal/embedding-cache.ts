import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * On-disk cache of embedding vectors, keyed by a content+model hash.
 *
 * Embedding is the slow/expensive part of an AI search build, so unchanged
 * chunks are never re-embedded across builds. Modeled on the Twoslash cache: a
 * single JSON file under `{cacheDir}/ai-search`, loaded once and written once
 * per build.
 */

const version = 1

export type Cache = {
  /** Returns a cached vector for `key`, or `undefined` on a miss. */
  get: (key: string) => number[] | undefined
  /** Stores a vector for `key`. */
  set: (key: string, vector: number[]) => void
  /** Persists the cache to disk (no-op when ignored). */
  save: () => void
  /** Build-time counters for logging. */
  readonly stats: { hits: number; misses: number }
}

export function load(options: load.Options): Cache {
  const { dir, ignore = false } = options
  const file = path.join(dir, `embeddings-v${version}.json`)

  const store = new Map<string, number[]>()
  if (!ignore && fs.existsSync(file)) {
    try {
      const json = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
        version: number
        entries: Record<string, number[]>
      }
      if (json.version === version)
        for (const [key, vector] of Object.entries(json.entries)) store.set(key, vector)
    } catch {
      // Corrupt cache → start fresh.
    }
  }

  const stats = { hits: 0, misses: 0 }
  // Keys read or written this build. `save` persists only these, so entries
  // for removed/changed chunks are pruned instead of accreting forever.
  const touched = new Set<string>()

  return {
    stats,
    get(key) {
      const hit = store.get(key)
      if (hit) {
        stats.hits++
        touched.add(key)
      } else stats.misses++
      return hit
    },
    set(key, vector) {
      store.set(key, vector)
      touched.add(key)
    },
    save() {
      if (ignore) return
      try {
        fs.mkdirSync(dir, { recursive: true })
        const entries: Record<string, number[]> = {}
        for (const key of touched) {
          const vector = store.get(key)
          if (vector) entries[key] = vector
        }
        const tmp = `${file}.${process.pid}.tmp`
        fs.writeFileSync(tmp, JSON.stringify({ version, entries }), 'utf-8')
        fs.renameSync(tmp, file)
      } catch {
        // Read-only filesystem (e.g. serverless) — skip persisting.
      }
    },
  }
}

export declare namespace load {
  type Options = {
    /** Directory to store the cache file in. */
    dir: string
    /** Skip reading and writing the cache entirely. */
    ignore?: boolean | undefined
  }
}

/**
 * Computes a stable cache key from the embedder identity, chunking shape, and
 * the chunk's embedding text. Changing model, dimensions, chunking, or text all
 * invalidate the entry.
 */
export function key(input: key.Input): string {
  return crypto
    .createHash('md5')
    .update(
      JSON.stringify({
        version,
        adapter: { type: input.adapterType, model: input.model, dimensions: input.dimensions },
        chunking: input.chunking,
        text: input.text,
      }),
    )
    .digest('hex')
}

export declare namespace key {
  type Input = {
    adapterType: string
    model: string
    dimensions: number | undefined
    chunking: unknown
    text: string
  }
}
