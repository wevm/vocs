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

describe('fetchMarkdown', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

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
