import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as Config from './config.js'
import * as ConfigSerializer from './config-serializer.js'
import * as Embedding from './embedding.js'
import * as Reranker from './reranker.js'
import * as Retriever from './retriever.js'

const ctx = { basePath: '/' }

/** A no-op low-level retrieval adapter. */
const adapter: Retriever.Adapter = { type: 'x', retrieve: async () => [] }

function toConfig(resolved: Retriever.resolveManaged.ReturnType): Config.Config {
  if (!resolved) throw new Error('resolve returned undefined')
  return {
    ai: { retriever: resolved.public },
    _retriever: resolved.private,
  } as unknown as Config.Config
}

describe('normalize', () => {
  const embedding = Embedding.from({
    type: 'x',
    model: 'x',
    embed: async (input) => input.map(() => [0]),
  })

  it('returns {} for no input', () => {
    expect(Retriever.normalize(undefined)).toEqual({})
  })

  it('routes Retriever.local to a local input', () => {
    const { managed, local } = Retriever.normalize(Retriever.local({ embedding }))
    expect(managed).toBeUndefined()
    expect((local as { embedding?: unknown })?.embedding).toBe(embedding)
  })

  it('routes a managed retriever to a managed input', () => {
    const managedRetriever = Retriever.from(adapter)
    const { managed, local } = Retriever.normalize(managedRetriever)
    expect(local).toBeUndefined()
    expect(managed?.adapter).toBe(adapter)
  })

  it('maps shared knobs onto a local input', () => {
    const { local } = Retriever.normalize(
      Retriever.local({
        embedding,
        sources: ['https://viem.sh/sitemap.xml'],
        hybrid: { keywordWeight: 0.4 },
        topK: 12,
        ui: { debounceMs: 100 },
      }),
    )
    expect(local).toMatchObject({
      embedding,
      sources: ['https://viem.sh/sitemap.xml'],
      retrieval: { topK: 12, hybrid: true, keywordWeight: 0.4 },
      ui: { debounceMs: 100 },
    })
  })

  it('carries shared knobs on a managed retriever', () => {
    const { managed } = Retriever.normalize(Retriever.from(adapter, { hybrid: true, topK: 5 }))
    expect(managed).toMatchObject({ adapter, hybrid: true, topK: 5 })
  })
})

describe('resolveManaged', () => {
  it('returns undefined when input is falsy or disabled', () => {
    expect(Retriever.resolveManaged(undefined, ctx)).toBeUndefined()
    expect(
      Retriever.resolveManaged(Retriever.from(adapter, { enabled: false }), ctx),
    ).toBeUndefined()
  })

  it('resolves a managed retriever', () => {
    const resolved = Retriever.resolveManaged(Retriever.from(adapter), ctx)
    expect(resolved?.private.adapter).toBe(adapter)
    expect(resolved?.public.enabled).toBe(true)
    expect(resolved?.public.endpoint).toBe('/api/search')
  })

  it('derives endpoint from basePath and defaults hybrid off', () => {
    const resolved = Retriever.resolveManaged(Retriever.from(adapter), { basePath: '/docs/' })
    expect(resolved?.public.endpoint).toBe('/docs/api/search')
    expect(resolved?.public.hybrid).toEqual({
      enabled: false,
      keywordWeight: 0.3,
      semanticWeight: 0.7,
    })
    expect(resolved?.private.topK).toBe(8)
  })

  it('honors hybrid true/false and custom weights/topK', () => {
    expect(
      Retriever.resolveManaged(Retriever.from(adapter, { hybrid: true }), ctx)?.public.hybrid
        .enabled,
    ).toBe(true)
    expect(
      Retriever.resolveManaged(Retriever.from(adapter, { hybrid: false }), ctx)?.public.hybrid
        .enabled,
    ).toBe(false)
    const custom = Retriever.resolveManaged(
      Retriever.from(adapter, { hybrid: { keywordWeight: 0.5, semanticWeight: 0.5 }, topK: 12 }),
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

describe('retrieveManaged', () => {
  it('dedupes by href and caps at limit', async () => {
    const dupAdapter: Retriever.Adapter = {
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
    }
    const config = toConfig(Retriever.resolveManaged(Retriever.from(dupAdapter, { topK: 5 }), ctx))
    const results = await Retriever.retrieveManaged(config, { query: 'hi' })
    expect(results.map((r) => r.href)).toEqual(['/a', '/b'])
  })
})

describe('handleSearchRequest (managed)', () => {
  it('400s on missing query, 404s when disabled', async () => {
    const config = toConfig(Retriever.resolveManaged(Retriever.from(adapter), ctx))

    const bad = await Retriever.handleSearchRequest(
      new Request('http://x/api/search', { method: 'POST', body: '{}' }),
      config,
    )
    expect(bad.status).toBe(400)

    const off = await Retriever.handleSearchRequest(
      new Request('http://x/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'hi' }),
      }),
      {} as Config.Config,
    )
    expect(off.status).toBe(404)
  })

  it('returns results from the adapter', async () => {
    const okAdapter: Retriever.Adapter = {
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
    }
    const config = toConfig(Retriever.resolveManaged(Retriever.from(okAdapter), ctx))
    const response = await Retriever.handleSearchRequest(
      new Request('http://x/api/search', {
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
    const { adapter } = Retriever.cloudflare({ accountId: '', apiToken: '', instance: 'docs' })
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
    const { adapter } = Retriever.cloudflare({
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
    const { adapter } = Retriever.cloudflare({
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
    const { adapter } = Retriever.cloudflare({ accountId: 'a', apiToken: 't', instance: 'docs' })
    await expect(adapter.retrieve('hi', { limit: 5 })).rejects.toThrow(/401/)
  })
})

function makeSite(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-ai-'))
  const pages = path.join(dir, 'src', 'pages')
  fs.mkdirSync(pages, { recursive: true })
  fs.writeFileSync(
    path.join(pages, 'index.mdx'),
    `# Getting Started\n\nVocs is a documentation framework powered by Vite.\n\n## Installation\n\nRun npm install vocs to add it to your project.\n`,
  )
  fs.writeFileSync(
    path.join(pages, 'search.mdx'),
    `# Search\n\nVocs ships keyword search and optional semantic AI search.\n\n## Embeddings\n\nEmbeddings are cached at build time to avoid repeated work.\n`,
  )
  return dir
}

describe('resolveLocal (config split)', () => {
  it('returns undefined when disabled', () => {
    expect(Retriever.resolveLocal(undefined, { basePath: '/' })).toBeUndefined()
    expect(Retriever.resolveLocal(false, { basePath: '/' })).toBeUndefined()
    expect(
      Retriever.resolveLocal({ enabled: false, embedding: Embedding.mock() }, { basePath: '/' }),
    ).toBeUndefined()
  })

  it('warns and disables when no embedding provided', () => {
    expect(Retriever.resolveLocal({}, { basePath: '/' })).toBeUndefined()
  })

  it('splits public + private config', () => {
    const resolved = Retriever.resolveLocal({ embedding: Embedding.mock() }, { basePath: '/' })
    expect(resolved?.public.enabled).toBe(true)
    expect(resolved?.public.runtime).toBe('server')
    expect(resolved?.public.endpoint).toBe('/api/search')
    // adapters live only in the private half
    expect(resolved?.private.embedding.type).toBe('mock')
    expect(resolved?.public).not.toHaveProperty('embedding')
  })

  it('honors basePath in the endpoint', () => {
    const resolved = Retriever.resolveLocal({ embedding: Embedding.mock() }, { basePath: '/docs/' })
    expect(resolved?.public.endpoint).toBe('/docs/api/search')
  })

  it("coerces runtime: 'client' to 'server' (not implemented yet)", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const resolved = Retriever.resolveLocal(
        { embedding: Embedding.mock(), runtime: 'client' },
        { basePath: '/' },
      )
      expect(resolved?.public.runtime).toBe('server')
      expect(resolved?.private.runtime).toBe('server')
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not implemented'))
    } finally {
      warn.mockRestore()
    }
  })

  it('clamps chunking overlap below maxCharacters', () => {
    const resolved = Retriever.resolveLocal(
      {
        embedding: Embedding.mock(),
        chunking: { maxCharacters: 100, overlapCharacters: 100 },
      },
      { basePath: '/' },
    )
    expect(resolved?.private.chunking.maxCharacters).toBe(100)
    expect(resolved?.private.chunking.overlapCharacters).toBe(99)
  })
})

describe('config integration', () => {
  it('exposes public config on ai.retriever and private on _localRetriever', () => {
    const config = Config.define({
      ai: { retriever: Retriever.local({ embedding: Embedding.mock() }) },
    })
    expect(
      (config as unknown as { ai?: { retriever?: Retriever.PublicConfig } }).ai?.retriever?.enabled,
    ).toBe(true)
    expect(config._localRetriever?.embedding.type).toBe('mock')
  })

  it('is idempotent: re-defining a defined config preserves the local retriever', () => {
    // `Config.resolve` calls `define` a second time on an already-defined
    // config (where `ai.retriever` is public and `_localRetriever` holds the adapters).
    const first = Config.define({
      ai: { retriever: Retriever.local({ embedding: Embedding.mock() }) },
    })
    const second = Config.define(first as unknown as Parameters<typeof Config.define>[0])
    expect(second._localRetriever?.embedding.type).toBe('mock')
    expect(
      (second as unknown as { ai?: { retriever?: Retriever.PublicConfig } }).ai?.retriever?.enabled,
    ).toBe(true)
  })

  it('never serializes _localRetriever or embedding secrets to the client', () => {
    const config = Config.define({
      ai: {
        retriever: Retriever.local({ embedding: Embedding.openai({ apiKey: 'sk-secret' }) }),
      },
    })
    const serialized = ConfigSerializer.serialize(config)
    expect(serialized).not.toContain('sk-secret')
    expect(serialized).not.toContain('_localRetriever')
    // public config still round-trips
    const back = ConfigSerializer.deserialize(serialized)
    expect(
      (back as unknown as { ai?: { retriever?: Retriever.PublicConfig } }).ai?.retriever?.enabled,
    ).toBe(true)
  })
})

describe('chunk', () => {
  const docs = [
    {
      category: 'Docs',
      href: '/guide',
      id: '/guide#intro',
      searchPriority: undefined,
      subtitle: '',
      text: 'Short intro text.',
      title: 'Intro',
      titles: ['Guide'],
      type: 'section' as const,
    },
  ]

  it('prepends breadcrumb + heading context to embedding text', () => {
    const chunks = Retriever.chunk(docs, {
      maxCharacters: 1200,
      overlapCharacters: 160,
      includeHeadings: true,
      includeBreadcrumbs: true,
      includeNav: false,
    })
    expect(chunks).toHaveLength(1)
    expect(chunks[0]?.embeddingText).toContain('Docs')
    expect(chunks[0]?.embeddingText).toContain('Guide')
    expect(chunks[0]?.embeddingText).toContain('Intro')
    expect(chunks[0]?.embeddingText).toContain('Short intro text.')
  })

  it('carries a document `weight` onto its chunks', () => {
    const weighted = [{ ...(docs[0] as (typeof docs)[number]), weight: 0.5 }]
    const chunks = Retriever.chunk(weighted, {
      maxCharacters: 1200,
      overlapCharacters: 160,
      includeHeadings: true,
      includeBreadcrumbs: true,
      includeNav: false,
    })
    expect(chunks[0]?.weight).toBe(0.5)
  })

  it('skips nav docs unless includeNav', () => {
    const navDocs = [{ ...(docs[0] as (typeof docs)[number]), type: 'nav' as const, text: '' }]
    expect(
      Retriever.chunk(navDocs, {
        maxCharacters: 1200,
        overlapCharacters: 160,
        includeHeadings: true,
        includeBreadcrumbs: true,
        includeNav: false,
      }),
    ).toHaveLength(0)
  })

  it('terminates when overlap reaches maxCharacters (defensive stride)', () => {
    const longDocs = [{ ...(docs[0] as (typeof docs)[number]), text: 'a'.repeat(500) }]
    const chunks = Retriever.chunk(longDocs, {
      maxCharacters: 100,
      overlapCharacters: 100,
      includeHeadings: false,
      includeBreadcrumbs: false,
      includeNav: false,
    })
    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks.length).toBeLessThanOrEqual(500)
  })
})

describe('end-to-end (mock embedder)', () => {
  let dir: string

  beforeEach(() => {
    Retriever._resetServerIndexCache()
    dir = makeSite()
  })
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('builds a deterministic index and retrieves relevant results', async () => {
    const config = Config.define({
      rootDir: dir,
      ai: {
        retriever: Retriever.local({
          embedding: Embedding.mock({ dimensions: 64 }),
          cache: false,
        }),
      },
    })

    const manifest = await Retriever.buildIndex(config)
    expect(manifest.vectorStore.count).toBeGreaterThan(0)
    expect(manifest.embedding.type).toBe('mock')
    expect(manifest.vectors.format).toBe('float32')

    const results = await Retriever.retrieveLocal(config, { query: 'embeddings cache build time' })
    expect(results.length).toBeGreaterThan(0)
    // the embeddings section should surface for an embeddings query
    expect(results.some((r) => r.href.includes('/search'))).toBe(true)
  })

  it('applies a reranker to reorder candidates', async () => {
    const calls: { query: string; count: number }[] = []
    const reranker = Reranker.from({
      type: 'spy',
      model: 'spy',
      async rerank(query, documents, context) {
        calls.push({ query, count: documents.length })
        // Reverse the vector order so we can prove the reranker took effect.
        return documents
          .map((_, index) => ({ index, score: index }))
          .sort((a, b) => b.score - a.score)
          .slice(0, context.topK)
      },
    })
    const config = Config.define({
      rootDir: dir,
      ai: {
        retriever: Retriever.local({
          embedding: Embedding.mock({ dimensions: 64 }),
          reranker,
          cache: false,
        }),
      },
    })

    await Retriever.buildIndex(config)
    const results = await Retriever.retrieveLocal(config, { query: 'installation' })
    expect(results.length).toBeGreaterThan(0)
    expect(calls[0]?.query).toBe('installation')
    expect(calls[0]?.count).toBeGreaterThan(0)
  })

  it('boosts an exact title match (navigational intent)', async () => {
    // Uniform reranker scores make the lexical title boost the deciding factor,
    // so a query equal to a section title must rank that section first.
    const reranker = Reranker.from({
      type: 'uniform',
      model: 'uniform',
      async rerank(_query, documents, context) {
        return documents.map((_, index) => ({ index, score: 0.5 })).slice(0, context.topK)
      },
    })
    const config = Config.define({
      rootDir: dir,
      ai: {
        retriever: Retriever.local({
          embedding: Embedding.mock({ dimensions: 64 }),
          reranker,
          cache: false,
        }),
      },
    })

    await Retriever.buildIndex(config)
    const results = await Retriever.retrieveLocal(config, { query: 'installation' })
    expect(results[0]?.href).toContain('#installation')
    expect(results[0]?.title).toBe('Installation')
  })

  it('falls back to vector order when the reranker throws', async () => {
    const reranker = Reranker.from({
      type: 'boom',
      model: 'boom',
      async rerank() {
        throw new Error('rerank unavailable')
      },
    })
    const config = Config.define({
      rootDir: dir,
      ai: {
        retriever: Retriever.local({
          embedding: Embedding.mock({ dimensions: 64 }),
          reranker,
          cache: false,
        }),
      },
    })

    await Retriever.buildIndex(config)
    const results = await Retriever.retrieveLocal(config, { query: 'embeddings cache build time' })
    // Search still works despite the reranker failure.
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.href.includes('/search'))).toBe(true)
  })

  it('returns 202 (indexing) on the first request, then 200 once built', async () => {
    const config = Config.define({
      rootDir: dir,
      ai: {
        retriever: Retriever.local({ embedding: Embedding.mock(), cache: false }),
      },
    })
    const makeRequest = () =>
      new Request('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'installation' }),
      })

    // First request returns immediately while the index builds in the background.
    const first = await Retriever.handleSearchRequest(makeRequest(), config)
    expect(first.status).toBe(202)
    const firstJson = (await first.json()) as { results: Retriever.Result[]; indexing: boolean }
    expect(firstJson.indexing).toBe(true)
    expect(firstJson.results).toEqual([])

    // Wait for the background build to finish, then a subsequent request resolves.
    await Retriever.getServerIndex(config)
    const second = await Retriever.handleSearchRequest(makeRequest(), config)
    expect(second.status).toBe(200)
    const secondJson = (await second.json()) as { results: Retriever.Result[]; indexing: boolean }
    expect(secondJson.indexing).toBe(false)
    expect(Array.isArray(secondJson.results)).toBe(true)
  })

  it('dev (NODE_ENV=development) loads the prebuilt index instead of building', async () => {
    const prev = process.env['NODE_ENV']
    process.env['NODE_ENV'] = 'development'
    try {
      const config = Config.define({
        rootDir: dir,
        ai: {
          retriever: Retriever.local({
            embedding: Embedding.mock({ dimensions: 64 }),
            cache: false,
          }),
        },
      })
      // No prebuilt index yet → dev falls back to empty (keyword-only) results.
      expect(await Retriever.retrieveLocal(config, { query: 'embeddings' })).toEqual([])

      // Persist a prebuilt index (as `vocs embeddings generate` would), reset the
      // in-process cache, then dev serves semantic results from disk.
      const manifest = await Retriever.buildIndex(config)
      await Retriever.saveIndex(config, manifest)
      Retriever._resetServerIndexCache()

      const results = await Retriever.retrieveLocal(config, {
        query: 'embeddings cache build time',
      })
      expect(results.length).toBeGreaterThan(0)
    } finally {
      if (prev === undefined) delete process.env['NODE_ENV']
      else process.env['NODE_ENV'] = prev
    }
  })

  it('production prefers the prebuilt index over rebuilding', async () => {
    const purposes: string[] = []
    const inner = Embedding.mock({ dimensions: 64 })
    const embedding = Embedding.from({
      type: 'mock',
      model: 'mock',
      dimensions: 64,
      async embed(input, context) {
        purposes.push(context.purpose)
        return inner.embed(input, context)
      },
    })
    const config = Config.define({
      rootDir: dir,
      ai: { retriever: Retriever.local({ embedding, cache: false }) },
    })

    const manifest = await Retriever.buildIndex(config)
    await Retriever.saveIndex(config, manifest)
    Retriever._resetServerIndexCache()
    purposes.length = 0

    const results = await Retriever.retrieveLocal(config, { query: 'embeddings cache build time' })
    expect(results.length).toBeGreaterThan(0)
    // Only the query was embedded — the index came from the prebuilt manifest.
    expect(purposes).toEqual(['query'])
  })

  it('answers 503 (not 202) after a failed index build, without instant rebuilds', async () => {
    let attempts = 0
    const embedding = Embedding.from({
      type: 'boom',
      model: 'boom',
      async embed() {
        attempts++
        throw new Error('embedding unavailable')
      },
    })
    const config = Config.define({
      rootDir: dir,
      ai: { retriever: Retriever.local({ embedding, cache: false }) },
    })
    const makeRequest = () =>
      new Request('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'installation' }),
      })

    // First request kicks off the build and reports indexing.
    expect((await Retriever.handleSearchRequest(makeRequest(), config)).status).toBe(202)
    await expect(Retriever.getServerIndex(config)).rejects.toThrow('embedding unavailable')

    // Subsequent requests surface the failure and don't retrigger the build
    // until the backoff elapses.
    expect((await Retriever.handleSearchRequest(makeRequest(), config)).status).toBe(503)
    expect((await Retriever.handleSearchRequest(makeRequest(), config)).status).toBe(503)
    expect(attempts).toBe(1)
  })

  it('saveIndex/loadIndex round-trips the manifest', async () => {
    const config = Config.define({
      rootDir: dir,
      ai: {
        retriever: Retriever.local({
          embedding: Embedding.mock({ dimensions: 64 }),
          cache: false,
        }),
      },
    })
    const manifest = await Retriever.buildIndex(config)
    await Retriever.saveIndex(config, manifest)
    const loaded = await Retriever.loadIndex(config)
    expect(loaded?.vectorStore.count).toBe(manifest.vectorStore.count)
    expect(loaded?.embedding.type).toBe(manifest.embedding.type)
  })

  it('returns 404 when AI search is disabled', async () => {
    const config = Config.define({ rootDir: dir })
    const request = new Request('http://localhost/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'x' }),
    })
    expect((await Retriever.handleSearchRequest(request, config)).status).toBe(404)
  })

  it('returns 400 for an empty query', async () => {
    const config = Config.define({
      rootDir: dir,
      ai: {
        retriever: Retriever.local({ embedding: Embedding.mock(), cache: false }),
      },
    })
    const request = new Request('http://localhost/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: '   ' }),
    })
    expect((await Retriever.handleSearchRequest(request, config)).status).toBe(400)
  })
})
