import { afterEach, describe, expect, it, vi } from 'vitest'
import type * as Config from './config.js'
import * as Retriever from './retriever.js'

const ctx = { basePath: '/' }

function toConfig(resolved: Retriever.resolve.ReturnType): Config.Config {
  if (!resolved) throw new Error('resolve returned undefined')
  return {
    search: { retriever: resolved.public },
    _retriever: resolved.private,
  } as unknown as Config.Config
}

describe('resolve', () => {
  it('returns undefined when input is falsy or disabled', () => {
    expect(Retriever.resolve(undefined, ctx)).toBeUndefined()
    const adapter = Retriever.from({ type: 'x', retrieve: async () => [] })
    expect(Retriever.resolve({ adapter, enabled: false }, ctx)).toBeUndefined()
  })

  it('accepts an adapter shorthand', () => {
    const adapter = Retriever.from({ type: 'x', retrieve: async () => [] })
    const resolved = Retriever.resolve(adapter, ctx)
    expect(resolved?.private.adapter).toBe(adapter)
    expect(resolved?.public.enabled).toBe(true)
    expect(resolved?.public.endpoint).toBe('/api/search/retrieve')
  })

  it('derives endpoint from basePath and resolves hybrid defaults', () => {
    const adapter = Retriever.from({ type: 'x', retrieve: async () => [] })
    const resolved = Retriever.resolve({ adapter }, { basePath: '/docs/' })
    expect(resolved?.public.endpoint).toBe('/docs/api/search/retrieve')
    expect(resolved?.public.hybrid).toEqual({
      enabled: true,
      keywordWeight: 0.3,
      semanticWeight: 0.7,
    })
    expect(resolved?.private.topK).toBe(8)
  })

  it('honors hybrid: false and custom weights/topK', () => {
    const adapter = Retriever.from({ type: 'x', retrieve: async () => [] })
    expect(Retriever.resolve({ adapter, hybrid: false }, ctx)?.public.hybrid.enabled).toBe(false)
    const custom = Retriever.resolve(
      { adapter, hybrid: { keywordWeight: 0.5, semanticWeight: 0.5 }, topK: 12 },
      ctx,
    )
    expect(custom?.public.hybrid).toEqual({
      enabled: true,
      keywordWeight: 0.5,
      semanticWeight: 0.5,
    })
    expect(custom?.private.topK).toBe(12)
  })
})

describe('retrieve', () => {
  it('dedupes by href and caps at limit', async () => {
    const adapter = Retriever.from({
      type: 'x',
      retrieve: async () => [
        {
          category: '',
          href: '/a',
          id: '1',
          score: 0.9,
          snippet: 'a',
          title: 'A',
          titles: [],
          type: 'page',
        },
        {
          category: '',
          href: '/a',
          id: '2',
          score: 0.8,
          snippet: 'a2',
          title: 'A2',
          titles: [],
          type: 'section',
        },
        {
          category: '',
          href: '/b',
          id: '3',
          score: 0.7,
          snippet: 'b',
          title: 'B',
          titles: [],
          type: 'page',
        },
      ],
    })
    const config = toConfig(Retriever.resolve({ adapter, topK: 5 }, ctx))
    const results = await Retriever.retrieve(config, { query: 'hi' })
    expect(results.map((r) => r.href)).toEqual(['/a', '/b'])
  })
})

describe('handleSearchRequest', () => {
  it('400s on missing query, 404s when disabled', async () => {
    const adapter = Retriever.from({ type: 'x', retrieve: async () => [] })
    const config = toConfig(Retriever.resolve(adapter, ctx))

    const bad = await Retriever.handleSearchRequest(
      new Request('http://x/api/search/retrieve', { method: 'POST', body: '{}' }),
      config,
    )
    expect(bad.status).toBe(400)

    const off = await Retriever.handleSearchRequest(
      new Request('http://x/api/search/retrieve', {
        method: 'POST',
        body: JSON.stringify({ query: 'hi' }),
      }),
      {} as Config.Config,
    )
    expect(off.status).toBe(404)
  })

  it('returns results from the adapter', async () => {
    const adapter = Retriever.from({
      type: 'x',
      retrieve: async () => [
        {
          category: '',
          href: '/a',
          id: '1',
          score: 0.9,
          snippet: 'a',
          title: 'A',
          titles: [],
          type: 'page',
        },
      ],
    })
    const config = toConfig(Retriever.resolve(adapter, ctx))
    const response = await Retriever.handleSearchRequest(
      new Request('http://x/api/search/retrieve', {
        method: 'POST',
        body: JSON.stringify({ query: 'hi' }),
      }),
      config,
    )
    expect(response.status).toBe(200)
    const data = (await response.json()) as { results: Retriever.Result[] }
    expect(data.results[0]?.href).toBe('/a')
  })
})

describe('cloudflare', () => {
  afterEach(() => vi.restoreAllMocks())

  it('throws on missing credentials', async () => {
    const adapter = Retriever.cloudflare({ accountId: '', apiToken: '', instance: 'docs' })
    await expect(adapter.retrieve('hi', { limit: 5 })).rejects.toThrow(/accountId/)
  })

  it('maps chunks to results using metadata + key fallback', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          result: {
            chunks: [
              {
                id: 'c1',
                score: 0.95,
                text: 'Hello world',
                item: { key: 'guide/intro.md', metadata: { title: 'Intro', category: 'Guide' } },
              },
              {
                id: 'c2',
                score: 1.5,
                text: 'Derived',
                item: { metadata: { url: 'https://docs.example.com/reference/api' } },
              },
            ],
          },
          success: true,
        }),
        { status: 200 },
      ),
    )
    const adapter = Retriever.cloudflare({
      accountId: 'acc',
      apiToken: 'tok',
      instance: 'docs',
    })
    const results = await adapter.retrieve('hi', { limit: 10 })

    expect(fetchMock).toHaveBeenCalledOnce()
    const url = fetchMock.mock.calls[0]?.[0]
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acc/ai-search/instances/docs/search',
    )

    expect(results[0]).toMatchObject({
      category: 'Guide',
      href: '/guide/intro',
      id: 'c1',
      score: 0.95,
      title: 'Intro',
    })
    // Score clamped to [0,1]; title + breadcrumb derived from the canonical URL.
    expect(results[1]).toMatchObject({
      category: 'Reference',
      href: 'https://docs.example.com/reference/api',
      score: 1,
      title: 'Api',
    })
  })

  it('uses the namespace-scoped path when a namespace is set', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ result: { chunks: [] } }), { status: 200 }))
    const adapter = Retriever.cloudflare({
      accountId: 'acc',
      apiToken: 'tok',
      instance: 'tempo-global',
      namespace: 'default',
    })
    await adapter.retrieve('hi', { limit: 5 })
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acc/ai-search/namespaces/default/instances/tempo-global/search',
    )
  })

  it('throws on non-ok responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 401 }))
    const adapter = Retriever.cloudflare({ accountId: 'a', apiToken: 't', instance: 'docs' })
    await expect(adapter.retrieve('hi', { limit: 5 })).rejects.toThrow(/401/)
  })
})
