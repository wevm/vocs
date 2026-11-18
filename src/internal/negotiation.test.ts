import { Hono } from 'hono'
import { describe, expect, test } from 'vitest'
import * as Negotiation from './negotiation.js'

const chrome =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

describe('prefers', () => {
  test.each([
    ['text/markdown', true],
    ['*/*', false],
    ['text/markdown;q=0.9, text/html;q=0.3', true],
    ['text/markdown;q=0.3, text/html;q=0.9', false],
    ['text/markdown;q=0, */*', false],
    ['text/markdown, text/html', true],
    ['text/html', false],
    ['text/html, text/*;q=0.5, text/markdown;q=0.5', false],
    ['text/markdown;q=0.5, text/*;q=0.4', true],
    ['text/markdown;q=1.5', false],
    ['TEXT/MARKDOWN; Q=0.8, text/html;q=0.7', true],
  ])('a browser with Accept %j receives Markdown: %s', (accept, expected) => {
    expect(Negotiation.prefers({ accept, pathname: '/contact', userAgent: chrome })).toBe(expected)
  })

  test.each([
    ['curl/8.7.1', undefined, true],
    ['curl/8.7.1', '*/*', true],
    ['curl/8.7.1', 'text/html', false],
    ['Wget/1.21', undefined, true],
    ['xh/0.22', undefined, true],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0)', '*/*', true],
    ['Claude-User/1.0', undefined, true],
    ['Claude-SearchBot/1.0', undefined, true],
    ['ChatGPT-User/2.0', 'text/html', true],
    // An explicit `text/markdown` range decides for an agent too, even a refusal.
    ['GPTBot/1.0', 'text/markdown;q=0, text/html', false],
    ['Googlebot/2.1', 'text/markdown', false],
    ['Slackbot-LinkExpanding 1.0', 'text/markdown', false],
    [chrome, undefined, false],
  ])('%s with Accept %j receives Markdown: %s', (userAgent, accept, expected) => {
    expect(Negotiation.prefers({ accept, pathname: '/contact', userAgent })).toBe(expected)
  })

  test('a path that ends in .md receives Markdown, except for link-preview bots', () => {
    expect(Negotiation.prefers({ pathname: '/contact.md', userAgent: 'Googlebot/2.1' })).toBe(true)
    expect(Negotiation.prefers({ pathname: '/contact.md', accept: 'text/html' })).toBe(true)
    expect(Negotiation.prefers({ pathname: '/contact.md', userAgent: 'Slackbot 1.0' })).toBe(false)
  })
})

describe('path', () => {
  test.each([
    ['/', '/index.md'],
    ['/blog', '/blog.md'],
    ['/blog/', '/blog.md'],
    ['/de/contact/', '/de/contact.md'],
    ['/docs/v2.0/intro', '/docs/v2.0/intro.md'],
  ])('%s → %s', (pathname, expected) => {
    expect(Negotiation.path(pathname)).toBe(expected)
  })
})

describe('page', () => {
  test.each([
    ['/', '/'],
    ['/index.md', '/'],
    ['/blog.md', '/blog'],
    ['/blog/', '/blog'],
    ['/foo/index.md', '/foo'],
    ['/foo/index', '/foo'],
    ['/indexes.md', '/indexes'],
  ])('%s → %s', (pathname, expected) => {
    expect(Negotiation.page(pathname)).toBe(expected)
  })

  test('round-trips with path', () => {
    for (const page of ['/', '/blog', '/a/b/c'])
      expect(Negotiation.page(Negotiation.path(page))).toBe(page)
  })
})

describe('middleware', () => {
  const pages = new Map([
    ['/', '---\ntitle: Home\n---\n\n# Home\n'],
    ['/contact', '---\ntitle: Contact\n---\n\n# Contact\n'],
    ['/foo', '# Foo\n'],
  ])

  function app(options: Partial<Negotiation.middleware.Options> = {}) {
    const app = new Hono()
    app.use(
      Negotiation.middleware({
        exclude: [/^\/api\//, '/assets/'],
        index: () => '# llms.txt\n',
        resolve: (_c, page) => pages.get(page),
        ...options,
      }),
    )
    app.get('/api/*', (c) => c.json({ ok: true }))
    app.all('*', (c) => c.html('<!doctype html><p>html</p>'))
    return app
  }

  function get(path: string, headers: Record<string, string> = {}, method = 'GET') {
    return app().request(`https://example.com${path}`, { headers, method })
  }

  test('an agent receives llms.txt for /, and /index.md is the home page', async () => {
    for (const headers of [
      { 'user-agent': 'curl/8.7.1' },
      { 'user-agent': 'Mozilla/5.0 (compatible; GPTBot/1.0)' },
      { accept: 'text/markdown', 'user-agent': chrome },
    ]) {
      const response = await get('/', headers)
      expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
      expect(response.headers.get('link')).toBeNull()
      expect(await response.text()).toBe('# llms.txt\n')
    }
    const home = await get('/index.md', { 'user-agent': chrome })
    expect(await home.text()).toContain('# Home')
    expect(home.headers.get('link')).toBe('<https://example.com/>; rel="canonical"')
  })

  test('without index, an agent receives the home page for /', async () => {
    const response = await app({ index: undefined }).request('https://example.com/', {
      headers: { accept: 'text/markdown' },
    })
    expect(await response.text()).toContain('# Home')
  })

  test('the page URL and its .md URL return the same Markdown and canonical link', async () => {
    for (const [path, markdown] of [
      ['/contact/?source=agent', '/contact.md'],
      ['/foo/', '/foo/index.md'],
    ] as const) {
      const negotiated = await get(path, { accept: 'text/markdown', 'user-agent': chrome })
      const explicit = await get(markdown)
      expect(negotiated.status).toBe(200)
      expect(negotiated.headers.get('vary')).toBe('Accept, User-Agent')
      expect(await negotiated.text()).toBe(await explicit.text())
      expect(negotiated.headers.get('link')).toBe(explicit.headers.get('link'))
    }
    expect((await get('/contact.md')).headers.get('link')).toBe(
      '<https://example.com/contact>; rel="canonical"',
    )
  })

  test('canonical can be customized or omitted', async () => {
    const custom = await app({ canonical: (_c, page) => `https://docs.example${page}/` }).request(
      'https://example.com/contact.md',
    )
    expect(custom.headers.get('link')).toBe('<https://docs.example/contact/>; rel="canonical"')
    const none = await app({ canonical: false }).request('https://example.com/contact.md')
    expect(none.headers.get('link')).toBeNull()
  })

  test.each([
    ['text/markdown', 'text/markdown'],
    ['*/*', 'text/html'],
    ['text/markdown;q=0.9, text/html;q=0.3', 'text/markdown'],
    ['text/markdown;q=0.3, text/html;q=0.9', 'text/html'],
    ['text/markdown;q=0, */*', 'text/html'],
    ['text/markdown, text/html', 'text/markdown'],
    ['text/html', 'text/html'],
  ])('Accept %j receives %s, varied by Accept and User-Agent', async (accept, type) => {
    const response = await get('/contact/', { accept, 'user-agent': chrome })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain(type)
    expect(response.headers.get('vary')).toBe('Accept, User-Agent')
    expect(await response.text()).toMatch(type === 'text/markdown' ? /^---\n/ : /^<!doctype html>/)
  })

  test('curl with Accept: text/html receives HTML', async () => {
    const response = await get('/contact', { accept: 'text/html', 'user-agent': 'curl/8.7.1' })
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  test('link-preview bots and search engines receive HTML', async () => {
    const preview = await get('/', {
      accept: 'text/markdown',
      'user-agent': 'Slackbot-LinkExpanding 1.0',
    })
    expect(preview.headers.get('content-type')).toContain('text/html')
    const search = await get('/', { 'user-agent': 'Googlebot/2.1' })
    expect(search.headers.get('content-type')).toContain('text/html')
    const searchMarkdown = await get('/index.md', { 'user-agent': 'Googlebot/2.1' })
    expect(await searchMarkdown.text()).toContain('# Home')
  })

  test('an unknown .md path returns 404 in Markdown, and an unknown page falls through', async () => {
    const missing = await get('/missing.md', { 'user-agent': chrome })
    expect(missing.status).toBe(404)
    expect(missing.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(await missing.text()).toBe('Not found\n')

    const page = await get('/missing', { accept: 'text/markdown' })
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toContain('text/html')
    expect(page.headers.get('vary')).toBe('Accept, User-Agent')
  })

  test('HEAD negotiates like GET, and other methods pass through', async () => {
    const head = await get('/contact/', { accept: 'text/markdown' }, 'HEAD')
    expect(head.status).toBe(200)
    expect(head.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(head.headers.get('link')).toBe('<https://example.com/contact>; rel="canonical"')
    expect(await head.text()).toBe('')

    const post = await get('/contact.md', { accept: 'text/markdown' }, 'POST')
    expect(post.headers.get('content-type')).toContain('text/html')
    expect(post.headers.get('vary')).toBeNull()
  })

  test('excluded paths and static files ignore the Markdown preference', async () => {
    const api = await get('/api/health', { accept: 'text/markdown' })
    expect(api.headers.get('content-type')).toContain('application/json')
    expect(api.headers.get('vary')).toBeNull()
    for (const path of ['/assets/md/foo.md', '/openapi.json', '/llms.txt']) {
      const response = await get(path, { 'user-agent': 'curl/8.7.1' })
      expect(response.headers.get('content-type'), path).toContain('text/html')
    }
  })

  test('resolve may return a response, such as a redirect', async () => {
    const response = await app({
      resolve: (c, page) => (page === '/old' ? c.redirect('/contact.md', 307) : undefined),
    }).request('https://example.com/old.md')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('/contact.md')
  })
})
