import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as Config from './config.js'
import * as ConfigSerializer from './config-serializer.js'
import * as Embedding from './embedding.js'
import * as Rag from './rag.js'

function makeSite(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-rag-'))
  const pages = path.join(dir, 'src', 'pages')
  fs.mkdirSync(pages, { recursive: true })
  fs.writeFileSync(
    path.join(pages, 'index.mdx'),
    `# Getting Started\n\nVocs is a documentation framework powered by Vite.\n\n## Installation\n\nRun npm install vocs to add it to your project.\n`,
  )
  fs.writeFileSync(
    path.join(pages, 'search.mdx'),
    `# Search\n\nVocs ships keyword search and optional semantic RAG search.\n\n## Embeddings\n\nEmbeddings are cached at build time to avoid repeated work.\n`,
  )
  return dir
}

describe('Rag.resolve (config split)', () => {
  it('returns undefined when disabled', () => {
    expect(Rag.resolve(undefined, { basePath: '/' })).toBeUndefined()
    expect(Rag.resolve(false, { basePath: '/' })).toBeUndefined()
    expect(
      Rag.resolve({ enabled: false, embedding: Embedding.mock() }, { basePath: '/' }),
    ).toBeUndefined()
  })

  it('warns and disables when no embedding provided', () => {
    expect(Rag.resolve({}, { basePath: '/' })).toBeUndefined()
  })

  it('splits public + private config', () => {
    const resolved = Rag.resolve({ embedding: Embedding.mock() }, { basePath: '/' })
    expect(resolved?.public.enabled).toBe(true)
    expect(resolved?.public.runtime).toBe('server')
    expect(resolved?.public.endpoint).toBe('/api/search/rag')
    // adapters live only in the private half
    expect(resolved?.private.embedding.type).toBe('mock')
    expect(resolved?.public).not.toHaveProperty('embedding')
  })

  it('honors basePath in the endpoint', () => {
    const resolved = Rag.resolve({ embedding: Embedding.mock() }, { basePath: '/docs/' })
    expect(resolved?.public.endpoint).toBe('/docs/api/search/rag')
  })
})

describe('config integration', () => {
  it('exposes public rag on search and private on _rag', () => {
    const config = Config.define({ search: { rag: { embedding: Embedding.mock() } } })
    expect((config.search as unknown as { rag?: Rag.PublicConfig }).rag?.enabled).toBe(true)
    expect(config._rag?.embedding.type).toBe('mock')
  })

  it('is idempotent: re-defining a defined config preserves rag', () => {
    // `Config.resolve` calls `define` a second time on an already-defined
    // config (where `search.rag` is public and `_rag` holds the adapters).
    const first = Config.define({ search: { rag: { embedding: Embedding.mock() } } })
    const second = Config.define(first as unknown as Parameters<typeof Config.define>[0])
    expect(second._rag?.embedding.type).toBe('mock')
    expect((second.search as unknown as { rag?: Rag.PublicConfig }).rag?.enabled).toBe(true)
  })

  it('never serializes _rag or embedding secrets to the client', () => {
    const config = Config.define({
      search: { rag: { embedding: Embedding.openai({ apiKey: 'sk-secret' }) } },
    })
    const serialized = ConfigSerializer.serialize(config)
    expect(serialized).not.toContain('sk-secret')
    expect(serialized).not.toContain('_rag')
    // public config still round-trips
    const back = ConfigSerializer.deserialize(serialized)
    expect((back.search as unknown as { rag?: Rag.PublicConfig }).rag?.enabled).toBe(true)
  })
})

describe('Rag.chunk', () => {
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
    const chunks = Rag.chunk(docs, {
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

  it('skips nav docs unless includeNav', () => {
    const navDocs = [{ ...(docs[0] as (typeof docs)[number]), type: 'nav' as const, text: '' }]
    expect(
      Rag.chunk(navDocs, {
        maxCharacters: 1200,
        overlapCharacters: 160,
        includeHeadings: true,
        includeBreadcrumbs: true,
        includeNav: false,
      }),
    ).toHaveLength(0)
  })
})

describe('end-to-end (mock embedder)', () => {
  let dir: string

  beforeEach(() => {
    Rag._resetServerIndexCache()
    dir = makeSite()
  })
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('builds a deterministic index and retrieves relevant results', async () => {
    const config = Config.define({
      rootDir: dir,
      search: { rag: { embedding: Embedding.mock({ dimensions: 64 }), cache: false } },
    })

    const manifest = await Rag.buildIndex(config)
    expect(manifest.vectorStore.count).toBeGreaterThan(0)
    expect(manifest.embedding.type).toBe('mock')
    expect(manifest.vectors.format).toBe('float32')

    const results = await Rag.retrieve(config, { query: 'embeddings cache build time' })
    expect(results.length).toBeGreaterThan(0)
    // the embeddings section should surface for an embeddings query
    expect(results.some((r) => r.href.includes('/search'))).toBe(true)
  })

  it('returns 202 (indexing) on the first request, then 200 once built', async () => {
    const config = Config.define({
      rootDir: dir,
      search: { rag: { embedding: Embedding.mock(), cache: false } },
    })
    const makeRequest = () =>
      new Request('http://localhost/api/search/rag', {
        method: 'POST',
        body: JSON.stringify({ query: 'installation' }),
      })

    // First request returns immediately while the index builds in the background.
    const first = await Rag.handleSearchRequest(makeRequest(), config)
    expect(first.status).toBe(202)
    const firstJson = (await first.json()) as { results: Rag.Result[]; indexing: boolean }
    expect(firstJson.indexing).toBe(true)
    expect(firstJson.results).toEqual([])

    // Wait for the background build to finish, then a subsequent request resolves.
    await Rag.getServerIndex(config)
    const second = await Rag.handleSearchRequest(makeRequest(), config)
    expect(second.status).toBe(200)
    const secondJson = (await second.json()) as { results: Rag.Result[]; indexing: boolean }
    expect(secondJson.indexing).toBe(false)
    expect(Array.isArray(secondJson.results)).toBe(true)
  })

  it('returns 404 when RAG is disabled', async () => {
    const config = Config.define({ rootDir: dir })
    const request = new Request('http://localhost/api/search/rag', {
      method: 'POST',
      body: JSON.stringify({ query: 'x' }),
    })
    expect((await Rag.handleSearchRequest(request, config)).status).toBe(404)
  })

  it('returns 400 for an empty query', async () => {
    const config = Config.define({
      rootDir: dir,
      search: { rag: { embedding: Embedding.mock(), cache: false } },
    })
    const request = new Request('http://localhost/api/search/rag', {
      method: 'POST',
      body: JSON.stringify({ query: '   ' }),
    })
    expect((await Rag.handleSearchRequest(request, config)).status).toBe(400)
  })
})
