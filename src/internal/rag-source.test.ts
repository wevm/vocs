import { describe, expect, it } from 'vitest'
import * as RagSource from './rag-source.js'

describe('parseSitemapLocs', () => {
  it('extracts <loc> URLs', () => {
    const xml = `<?xml version="1.0"?>
      <urlset>
        <url><loc>https://example.com/a</loc></url>
        <url><loc> https://example.com/b </loc></url>
      </urlset>`
    expect(RagSource.parseSitemapLocs(xml)).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ])
  })

  it('decodes entities in URLs', () => {
    const xml = '<url><loc>https://example.com/a?x=1&amp;y=2</loc></url>'
    expect(RagSource.parseSitemapLocs(xml)).toEqual(['https://example.com/a?x=1&y=2'])
  })
})

describe('parseLlmsTxt', () => {
  it('extracts markdown links and bare URLs, resolving relative paths', () => {
    const text = `# Docs
- [Getting Started](/docs/start)
- [API](https://example.com/api "API Reference")

See also https://example.com/extra`
    expect(RagSource.parseLlmsTxt(text, 'https://example.com/llms.txt')).toEqual([
      'https://example.com/docs/start',
      'https://example.com/api',
      'https://example.com/extra',
    ])
  })

  it('de-duplicates URLs', () => {
    const text = '[a](https://example.com/a)\n[a again](https://example.com/a)'
    expect(RagSource.parseLlmsTxt(text, 'https://example.com')).toEqual(['https://example.com/a'])
  })
})

describe('extractDocument', () => {
  it('extracts title and text from HTML', () => {
    const html = `<html><head><title>Fallback</title></head>
      <body><main><h1>Real Title</h1><p>Hello <b>world</b>.</p>
      <script>ignore()</script></main></body></html>`
    const doc = RagSource.extractDocument('https://example.com/page', html)
    expect(doc.title).toBe('Real Title')
    expect(doc.href).toBe('https://example.com/page')
    expect(doc.text).toContain('Hello')
    expect(doc.text).toContain('world')
    expect(doc.text).not.toContain('ignore')
  })

  it('uses the first heading as the title for markdown', () => {
    const md = '# My Page\n\nSome content here.'
    const doc = RagSource.extractDocument('https://example.com/x.md', md)
    expect(doc.title).toBe('My Page')
    expect(doc.text).toContain('Some content here.')
  })

  it('derives a title from the URL when none is found', () => {
    const doc = RagSource.extractDocument('https://example.com/getting-started', 'plain text')
    expect(doc.title).toBe('Getting Started')
  })

  it('strips a .md/.mdx extension from the stored href', () => {
    expect(RagSource.extractDocument('https://x.com/react/why.md', '# Why').href).toBe(
      'https://x.com/react/why',
    )
    expect(RagSource.extractDocument('https://x.com/a.mdx?v=1#top', '# A').href).toBe(
      'https://x.com/a?v=1#top',
    )
    // Non-doc extensions and clean paths are untouched.
    expect(RagSource.extractDocument('https://x.com/docs/intro', '# Intro').href).toBe(
      'https://x.com/docs/intro',
    )
  })
})

describe('extractDocument (markdown body)', () => {
  it('cleans frontmatter + Markdown out of the embedded text', () => {
    const md = '---\nurl: /a.md\n---\n# Title\n\nHello [world](https://x.com).'
    const doc = RagSource.extractDocument('https://x.com/a.md', md)
    expect(doc.title).toBe('Title')
    expect(doc.text).not.toContain('---')
    expect(doc.text).not.toContain('](https://x.com)')
    expect(doc.text).toContain('Hello world.')
  })
})

describe('stripDocExtension', () => {
  it('removes trailing .md and .mdx, preserving query and hash', () => {
    expect(RagSource.stripDocExtension('https://x.com/a.md')).toBe('https://x.com/a')
    expect(RagSource.stripDocExtension('https://x.com/a.mdx')).toBe('https://x.com/a')
    expect(RagSource.stripDocExtension('https://x.com/a.md?q=1#h')).toBe('https://x.com/a?q=1#h')
    expect(RagSource.stripDocExtension('https://x.com/readme.txt')).toBe('https://x.com/readme.txt')
  })
})

describe('load', () => {
  it('returns an empty array for no sources', async () => {
    expect(await RagSource.load([])).toEqual([])
  })

  it('fetches plain page URLs and extracts documents', async () => {
    const fetchMock = mockFetch({
      'https://example.com/a': '# Page A\n\nAlpha content.',
      'https://example.com/b': '# Page B\n\nBeta content.',
    })
    const docs = await RagSource.load(['https://example.com/a', 'https://example.com/b'])
    fetchMock.restore()

    expect(docs.map((d) => d.title)).toEqual(['Page A', 'Page B'])
    expect(docs.map((d) => d.href)).toEqual(['https://example.com/a', 'https://example.com/b'])
  })

  it('expands a sitemap.xml into its listed pages', async () => {
    const fetchMock = mockFetch({
      'https://example.com/sitemap.xml':
        '<urlset><url><loc>https://example.com/one</loc></url><url><loc>https://example.com/two</loc></url></urlset>',
      'https://example.com/one': '# One\n\nContent one.',
      'https://example.com/two': '# Two\n\nContent two.',
    })
    const docs = await RagSource.load(['https://example.com/sitemap.xml'])
    fetchMock.restore()

    expect(docs.map((d) => d.href).sort()).toEqual([
      'https://example.com/one',
      'https://example.com/two',
    ])
  })

  it('expands an llms.txt into its linked pages', async () => {
    const fetchMock = mockFetch({
      'https://example.com/llms.txt': '# Docs\n- [One](https://example.com/one)',
      'https://example.com/one': '# One\n\nContent one.',
    })
    const docs = await RagSource.load(['https://example.com/llms.txt'])
    fetchMock.restore()

    expect(docs.map((d) => d.href)).toEqual(['https://example.com/one'])
  })

  it('de-duplicates pages resolved from multiple sources', async () => {
    const fetchMock = mockFetch({
      'https://example.com/sitemap.xml':
        '<urlset><url><loc>https://example.com/one</loc></url></urlset>',
      'https://example.com/one': '# One\n\nContent one.',
    })
    const docs = await RagSource.load([
      'https://example.com/sitemap.xml',
      'https://example.com/one',
    ])
    fetchMock.restore()

    expect(docs).toHaveLength(1)
  })

  it('attaches a source `label`/`weight` to every expanded page', async () => {
    const fetchMock = mockFetch({
      'https://example.com/llms.txt':
        '# Docs\n- [One](https://example.com/one)\n- [Two](https://example.com/two)',
      'https://example.com/one': '# One\n\nContent one.',
      'https://example.com/two': '# Two\n\nContent two.',
    })
    const docs = await RagSource.load([
      { url: 'https://example.com/llms.txt', label: 'Example', weight: 0.5 },
    ])
    fetchMock.restore()

    expect(docs).toHaveLength(2)
    expect(docs.every((d) => d.label === 'Example' && d.weight === 0.5)).toBe(true)
  })

  it('treats a bare string as `{ url }` with no label/weight', async () => {
    const fetchMock = mockFetch({ 'https://example.com/a': '# A\n\nAlpha.' })
    const [doc] = await RagSource.load(['https://example.com/a'])
    fetchMock.restore()

    expect(doc?.label).toBeUndefined()
    expect(doc?.weight).toBeUndefined()
  })

  it('skips pages that fail to fetch rather than throwing', async () => {
    const fetchMock = mockFetch({
      'https://example.com/ok': '# OK\n\nGood.',
      // /bad omitted → 404
    })
    const docs = await RagSource.load(['https://example.com/ok', 'https://example.com/bad'])
    fetchMock.restore()

    expect(docs.map((d) => d.href)).toEqual(['https://example.com/ok'])
  })
})

function mockFetch(routes: Record<string, string>) {
  const original = globalThis.fetch
  globalThis.fetch = (async (input: string | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    const body = routes[url]
    if (body === undefined) return new Response('not found', { status: 404 })
    return new Response(body, { status: 200 })
  }) as typeof fetch
  return {
    restore() {
      globalThis.fetch = original
    },
  }
}
