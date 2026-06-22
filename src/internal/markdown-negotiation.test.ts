import { describe, expect, test } from 'vitest'
import { prefersMarkdown } from './markdown-negotiation.js'

describe('prefersMarkdown', () => {
  test('serves Markdown for an explicit `.md` suffix', () => {
    expect(prefersMarkdown({ pathname: '/api/pets.md' })).toBe(true)
  })

  test('serves Markdown for `Accept: text/markdown`', () => {
    expect(prefersMarkdown({ pathname: '/api/pets', accept: 'text/markdown' })).toBe(true)
  })

  test('serves Markdown for terminal clients', () => {
    expect(prefersMarkdown({ pathname: '/api/pets', userAgent: 'curl/8.4.0' })).toBe(true)
  })

  test('serves Markdown for AI agents', () => {
    expect(prefersMarkdown({ pathname: '/api/pets', userAgent: 'ChatGPT-User/2.0' })).toBe(true)
  })

  test('serves HTML for search engines', () => {
    expect(prefersMarkdown({ pathname: '/api/pets', userAgent: 'Googlebot/2.1' })).toBe(false)
  })

  test('serves HTML for Open Graph bots, even with a `.md` suffix', () => {
    expect(prefersMarkdown({ pathname: '/api/pets.md', userAgent: 'Slackbot 1.0' })).toBe(false)
  })

  test('serves Markdown to search engines for an explicit `.md` suffix', () => {
    expect(prefersMarkdown({ pathname: '/api/pets.md', userAgent: 'Googlebot/2.1' })).toBe(true)
  })

  test('serves HTML for ordinary browsers', () => {
    expect(
      prefersMarkdown({
        pathname: '/api/pets',
        userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        accept: 'text/html',
      }),
    ).toBe(false)
  })
})
