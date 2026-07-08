import { afterEach, describe, expect, it, vi } from 'vitest'
import * as VectorStore from './vector-store.js'

describe('normalize', () => {
  it('produces a unit vector', () => {
    const v = VectorStore.normalize([3, 4])
    expect(v[0]).toBeCloseTo(0.6)
    expect(v[1]).toBeCloseTo(0.8)
    expect(Math.hypot(v[0] ?? 0, v[1] ?? 0)).toBeCloseTo(1)
  })

  it('passes zero vectors through', () => {
    expect([...VectorStore.normalize([0, 0, 0])]).toEqual([0, 0, 0])
  })
})

describe('pack/load/search', () => {
  const vectors = [
    VectorStore.normalize([1, 0, 0]),
    VectorStore.normalize([0, 1, 0]),
    VectorStore.normalize([0, 0, 1]),
  ]

  it('round-trips float32 and ranks the matching vector first', () => {
    const packed = VectorStore.pack(vectors, 'float32')
    expect(packed.format).toBe('float32')
    const store = VectorStore.load(packed)
    expect(store.count).toBe(3)
    expect(store.dimensions).toBe(3)

    const results = VectorStore.search(store, VectorStore.normalize([0.9, 0.1, 0]), 3)
    expect(results[0]?.index).toBe(0)
    expect(results[0]?.score ?? 0).toBeGreaterThan(results[1]?.score ?? 0)
  })

  it('round-trips int8 (quantized) and preserves ranking', () => {
    const packed = VectorStore.pack(vectors, 'int8')
    expect(packed.format).toBe('int8')
    expect(packed.scales).toBeTypeOf('string')
    const store = VectorStore.load(packed)

    const results = VectorStore.search(store, VectorStore.normalize([0, 0.2, 0.9]), 3)
    expect(results[0]?.index).toBe(2)
  })

  it('int8 scores approximate float32 scores', () => {
    const query = VectorStore.normalize([0.5, 0.5, 0.2])
    const f32 = VectorStore.search(VectorStore.load(VectorStore.pack(vectors, 'float32')), query, 1)
    const i8 = VectorStore.search(VectorStore.load(VectorStore.pack(vectors, 'int8')), query, 1)
    expect(i8[0]?.score ?? 0).toBeCloseTo(f32[0]?.score ?? 0, 1)
  })

  it('throws on dimension mismatch', () => {
    expect(() =>
      VectorStore.pack([new Float32Array([1, 0]), new Float32Array([1])], 'float32'),
    ).toThrow(/dimension mismatch/)
  })
})

describe('resolveFormat', () => {
  it('maps auto to float32 on server, int8 on client', () => {
    expect(VectorStore.resolveFormat('auto', 'server')).toBe('float32')
    expect(VectorStore.resolveFormat('auto', 'client')).toBe('int8')
    expect(VectorStore.resolveFormat('int8', 'server')).toBe('int8')
  })
})

describe('cloudflare (remote adapter)', () => {
  afterEach(() => vi.restoreAllMocks())

  /** In-memory Vectorize API fake backing the `fetch` mock. */
  function mockVectorize() {
    const state = {
      created: false,
      dimensions: undefined as number | undefined,
      requests: [] as { body: string | undefined; method: string; path: string }[],
      vectors: new Map<string, { metadata: Record<string, unknown>; values: number[] }>(),
    }
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      const method = init?.method ?? 'GET'
      const body = typeof init?.body === 'string' ? init.body : undefined
      state.requests.push({ body, method, path: url.pathname + url.search })

      const base = '/client/v4/accounts/acc/vectorize/v2/indexes'
      if (!url.pathname.startsWith(base)) return new Response('not found', { status: 404 })
      const rest = url.pathname.slice(base.length)

      // Create index.
      if (rest === '' && method === 'POST') {
        state.created = true
        state.dimensions = JSON.parse(body ?? '{}').config?.dimensions
        return Response.json({ success: true })
      }
      // Get index.
      if (/^\/[^/]+$/.test(rest) && method === 'GET') {
        if (!state.created) return new Response('not found', { status: 404 })
        return Response.json({ result: { config: { dimensions: state.dimensions } } })
      }
      if (rest.endsWith('/list'))
        return Response.json({
          result: { isTruncated: false, vectors: [...state.vectors.keys()].map((id) => ({ id })) },
        })
      if (rest.endsWith('/upsert')) {
        for (const line of (body ?? '').split('\n')) {
          const { id, metadata, values } = JSON.parse(line)
          state.vectors.set(id, { metadata, values })
        }
        return Response.json({ success: true })
      }
      if (rest.endsWith('/delete_by_ids')) {
        const ids = JSON.parse(body ?? '{}').ids ?? []
        // Mirrors Vectorize error 40007.
        if (ids.length > 100)
          return Response.json(
            { success: false, errors: [{ code: 40007, message: 'too many ids in payload' }] },
            { status: 400 },
          )
        for (const id of ids) state.vectors.delete(id)
        return Response.json({ success: true })
      }
      if (rest.endsWith('/query')) {
        const { topK, vector } = JSON.parse(body ?? '{}')
        const matches = [...state.vectors.entries()]
          .map(([id, v]) => ({
            id,
            metadata: v.metadata,
            score: v.values.reduce((sum, x, i) => sum + x * (vector[i] ?? 0), 0),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, topK)
        return Response.json({ result: { matches } })
      }
      return new Response('bad request', { status: 400 })
    })
    return state
  }

  function entry(id: string, text: string, vector: number[]): VectorStore.RemoteEntry {
    return {
      id,
      metadata: { href: `/${id}`, text, title: id },
      vector: VectorStore.normalize(vector),
    }
  }

  const credentials = { accountId: 'acc', apiToken: 'tok' }

  it('throws on missing credentials', async () => {
    const store = VectorStore.cloudflare({ accountId: '', apiToken: '' })
    await expect(store.query(new Float32Array([1]), { topK: 5 })).rejects.toThrow(/accountId/)
  })

  it('creates the index on first sync and upserts all entries', async () => {
    const state = mockVectorize()
    const store = VectorStore.cloudflare(credentials)

    const result = await store.sync([entry('a', 'alpha', [1, 0]), entry('b', 'beta', [0, 1])], {
      dimensions: 2,
    })

    expect(state.created).toBe(true)
    expect(state.dimensions).toBe(2)
    expect(result).toEqual({ deleted: 0, skipped: 0, upserted: 2 })
    expect(state.vectors.size).toBe(2)
    // Content-addressed ids: 64 hex chars (Vectorize's id byte cap).
    for (const id of state.vectors.keys()) expect(id).toMatch(/^[0-9a-f]{64}$/)
  })

  it('re-sync skips unchanged entries and prunes stale ones', async () => {
    const state = mockVectorize()
    const store = VectorStore.cloudflare(credentials)

    await store.sync([entry('a', 'alpha', [1, 0]), entry('b', 'beta', [0, 1])], { dimensions: 2 })
    const result = await store.sync([entry('a', 'alpha', [1, 0]), entry('c', 'gamma', [1, 1])], {
      dimensions: 2,
    })

    expect(result).toEqual({ deleted: 1, skipped: 1, upserted: 1 })
    expect(state.vectors.size).toBe(2)
  })

  it('batches deletes within the 100-id Vectorize limit', async () => {
    const state = mockVectorize()
    const store = VectorStore.cloudflare(credentials)

    const entries = Array.from({ length: 150 }, (_, i) => entry(`e${i}`, `text ${i}`, [1, i]))
    await store.sync(entries, { dimensions: 2 })
    const result = await store.sync([entry('keep', 'kept', [1, 0])], { dimensions: 2 })

    expect(result).toEqual({ deleted: 150, skipped: 0, upserted: 1 })
    expect(state.vectors.size).toBe(1)
  })

  it('rejects a dimension change against an existing index', async () => {
    mockVectorize()
    const store = VectorStore.cloudflare(credentials)
    await store.sync([entry('a', 'alpha', [1, 0])], { dimensions: 2 })
    await expect(store.sync([entry('a', 'alpha', [1, 0, 0])], { dimensions: 3 })).rejects.toThrow(
      /dimensions/,
    )
  })

  it('bounds oversized metadata under the Vectorize cap', async () => {
    const state = mockVectorize()
    const store = VectorStore.cloudflare(credentials)

    await store.sync([entry('big', 'x'.repeat(20_000), [1, 0])], { dimensions: 2 })

    const [stored] = [...state.vectors.values()]
    const size = new TextEncoder().encode(JSON.stringify(stored?.metadata)).length
    expect(size).toBeLessThanOrEqual(9216)
    // Trimmed, not dropped.
    expect(String(stored?.metadata['text']).length).toBeGreaterThan(0)
  })

  it('sanitizes metadata to Vectorize types (string | number | boolean | string[])', async () => {
    const state = mockVectorize()
    const store = VectorStore.cloudflare(credentials)

    await store.sync(
      [
        {
          id: 'a',
          // Sparse `titles` (skipped heading levels) serialize as nulls.
          metadata: {
            href: '/a',
            nested: { drop: true },
            none: null,
            title: 'a',
            titles: ['Guide', null, 'Steps'],
            weight: 0.8,
          },
          vector: VectorStore.normalize([1, 0]),
        },
      ],
      { dimensions: 2 },
    )

    const [stored] = [...state.vectors.values()]
    expect(stored?.metadata).toEqual({
      href: '/a',
      title: 'a',
      titles: ['Guide', 'Steps'],
      weight: 0.8,
    })
  })

  it('queries nearest vectors and caps topK at 50', async () => {
    const state = mockVectorize()
    const store = VectorStore.cloudflare(credentials)
    await store.sync([entry('a', 'alpha', [1, 0]), entry('b', 'beta', [0, 1])], { dimensions: 2 })

    const hits = await store.query(VectorStore.normalize([0.9, 0.1]), { topK: 100 })

    expect(hits[0]?.metadata?.['href']).toBe('/a')
    expect(hits[0]?.score ?? 0).toBeGreaterThan(hits[1]?.score ?? 0)
    const queryRequest = state.requests.find((r) => r.path.endsWith('/query'))
    expect(JSON.parse(queryRequest?.body ?? '{}').topK).toBe(50)
  })

  it('propagates query failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 401 }))
    const store = VectorStore.cloudflare(credentials)
    await expect(store.query(new Float32Array([1]), { topK: 5 })).rejects.toThrow(/401/)
  })
})
