import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}))

vi.mock('node:path', async () => {
  const actual = await vi.importActual<typeof import('node:path')>('node:path')
  return { ...actual, resolve: actual.resolve, join: actual.join, dirname: actual.dirname }
})

vi.mock('node:url', async () => {
  const actual = await vi.importActual<typeof import('node:url')>('node:url')
  return { ...actual }
})

const originalFetch = globalThis.fetch
const originalNodeEnv = process.env['NODE_ENV']

function restoreNodeEnv() {
  if (originalNodeEnv === undefined) delete process.env['NODE_ENV']
  else process.env['NODE_ENV'] = originalNodeEnv
}

afterEach(() => {
  restoreNodeEnv()
  vi.resetAllMocks()
  vi.resetModules()
  globalThis.fetch = originalFetch
})

describe('fetchMarkdown', () => {
  it('returns content from disk without making an HTTP fetch', async () => {
    const { readFile } = await import('node:fs/promises')
    vi.mocked(readFile).mockResolvedValue('# Hello from disk')

    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy

    const { fetchMarkdown } = await import('./md-router.js')
    const result = await fetchMarkdown(new URL('https://example.com'), '/llms.txt')

    expect(result).toBe('# Hello from disk')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('falls back to HTTP fetch with cookies when disk read fails', async () => {
    const { readFile } = await import('node:fs/promises')
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'))

    const fetchSpy = vi.fn().mockResolvedValue(new Response('# Hello from fetch', { status: 200 }))
    globalThis.fetch = fetchSpy

    const { fetchMarkdown } = await import('./md-router.js')
    const result = await fetchMarkdown(
      new URL('https://example.com'),
      '/assets/md/docs.md',
      'session=abc123',
    )

    expect(result).toBe('# Hello from fetch')
    expect(fetchSpy).toHaveBeenCalledOnce()
    const call = fetchSpy.mock.calls[0]
    expect(call?.[0].toString()).toBe('https://example.com/assets/md/docs.md')
    expect(call?.[1].headers).toEqual({ cookie: 'session=abc123' })
  })

  it('returns null when both disk and HTTP fetch fail', async () => {
    const { readFile } = await import('node:fs/promises')
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'))

    const fetchSpy = vi.fn().mockResolvedValue(new Response('Not Found', { status: 404 }))
    globalThis.fetch = fetchSpy

    const { fetchMarkdown } = await import('./md-router.js')
    const result = await fetchMarkdown(new URL('https://example.com'), '/assets/md/missing.md')

    expect(result).toBeNull()
  })
})

describe('middleware', () => {
  function request(url: string, headers?: HeadersInit) {
    const app = new Hono()
    return import('./md-router.js').then(({ middleware }) => {
      app.use('*', middleware())
      app.get('*', (c) => c.html('<p>ok</p>'))
      return app.request(url, headers ? { headers } : {})
    })
  }

  it('passes search engine crawlers through to HTML', async () => {
    process.env['NODE_ENV'] = 'production'

    const { readFile } = await import('node:fs/promises')
    vi.mocked(readFile).mockResolvedValue('# Hello from disk')

    const response = await request('http://localhost/docs', {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toBe('<p>ok</p>')
    expect(readFile).not.toHaveBeenCalled()
  })

  it('still serves markdown to AI agents', async () => {
    process.env['NODE_ENV'] = 'production'

    const { readFile } = await import('node:fs/promises')
    vi.mocked(readFile).mockResolvedValue('# Hello from disk')

    const response = await request('http://localhost/docs', {
      'user-agent': 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)',
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(await response.text()).toBe('# Hello from disk')
    expect(readFile).toHaveBeenCalledOnce()
  })
})
