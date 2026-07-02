import { describe, expect, it } from 'vitest'
import * as Reranker from './reranker.js'

describe('Reranker', () => {
  it('from returns the adapter as-is', () => {
    const adapter = Reranker.from({
      type: 'custom',
      model: 'x',
      async rerank() {
        return []
      },
    })
    expect(adapter.type).toBe('custom')
    expect(adapter.model).toBe('x')
  })

  it('mock scores by query-token overlap, best-first', async () => {
    const adapter = Reranker.mock()
    const results = await adapter.rerank(
      'embedding cache',
      ['nothing relevant here', 'embedding cache build', 'cache'],
      {},
    )
    // index 1 ("embedding cache build") has the highest overlap ratio.
    expect(results[0]?.index).toBe(1)
    expect(results.map((r) => r.index)).toEqual([1, 2, 0])
  })

  it('mock respects topK', async () => {
    const adapter = Reranker.mock()
    const results = await adapter.rerank('a b', ['a b', 'a', 'c'], { topK: 2 })
    expect(results).toHaveLength(2)
  })

  it('cloudflare posts query + contexts and passes scores through', async () => {
    const original = globalThis.fetch
    const calls: { url: string; headers: Record<string, string>; body: string }[] = []
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({
        url: String(url),
        headers: init.headers as Record<string, string>,
        body: String(init.body),
      })
      // Cloudflare returns relevance already mapped to [0, 1].
      return new Response(
        JSON.stringify({
          result: {
            response: [
              { id: 1, score: 0.688 },
              { id: 0, score: 0.0004 },
            ],
          },
          success: true,
        }),
        { status: 200 },
      )
    }) as typeof fetch
    let results: readonly Reranker.RerankResult[]
    try {
      const adapter = Reranker.cloudflare({ accountId: 'acc-1', apiToken: 'cf-test' })
      results = await adapter.rerank('q', ['doc a', 'doc b'], { topK: 2 })
    } finally {
      globalThis.fetch = original
    }
    expect(calls[0]?.url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acc-1/ai/run/@cf/baai/bge-reranker-base',
    )
    expect(calls[0]?.headers['Authorization']).toBe('Bearer cf-test')
    expect(JSON.parse(calls[0]?.body ?? '{}')).toEqual({
      query: 'q',
      contexts: [{ text: 'doc a' }, { text: 'doc b' }],
      top_k: 2,
    })
    expect(results[0]).toEqual({ index: 1, score: 0.688 })
    expect(results[1]).toEqual({ index: 0, score: 0.0004 })
  })

  it('cloudflare returns [] for empty input without a request', async () => {
    const original = globalThis.fetch
    let called = false
    globalThis.fetch = (async () => {
      called = true
      return new Response('{}', { status: 200 })
    }) as typeof fetch
    try {
      const adapter = Reranker.cloudflare({ accountId: 'a', apiToken: 't' })
      expect(await adapter.rerank('q', [], {})).toEqual([])
    } finally {
      globalThis.fetch = original
    }
    expect(called).toBe(false)
  })

  it('cloudflare throws without account id or token', async () => {
    await expect(Reranker.cloudflare({ apiToken: 't' }).rerank('q', ['a'], {})).rejects.toThrow(
      /accountId/,
    )
    await expect(Reranker.cloudflare({ accountId: 'a' }).rerank('q', ['a'], {})).rejects.toThrow(
      /apiToken/,
    )
  })
})
