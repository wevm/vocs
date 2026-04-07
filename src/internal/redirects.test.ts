import { describe, expect, it } from 'vitest'
import * as Redirects from './redirects.js'

describe('Redirects.appendSearch', () => {
  it('appends query string to bare path', () => {
    expect(Redirects.appendSearch('/overview', '?ref=nav')).toBe('/overview?ref=nav')
  })

  it('merges with existing query string', () => {
    expect(Redirects.appendSearch('/overview?tab=api', '?ref=nav')).toBe(
      '/overview?tab=api&ref=nav',
    )
  })

  it('inserts query before hash fragment', () => {
    expect(Redirects.appendSearch('/overview#intro', '?ref=nav')).toBe('/overview?ref=nav#intro')
  })

  it('merges query and preserves hash fragment', () => {
    expect(Redirects.appendSearch('/overview?tab=api#intro', '?ref=nav')).toBe(
      '/overview?tab=api&ref=nav#intro',
    )
  })

  it('returns destination unchanged when search is empty', () => {
    expect(Redirects.appendSearch('/overview', '')).toBe('/overview')
  })

  it('works with absolute URLs', () => {
    expect(Redirects.appendSearch('https://example.com/docs', '?ref=nav')).toBe(
      'https://example.com/docs?ref=nav',
    )
  })

  it('merges query on absolute URL with existing params', () => {
    expect(Redirects.appendSearch('https://example.com/docs?tab=api', '?ref=nav')).toBe(
      'https://example.com/docs?tab=api&ref=nav',
    )
  })

  it('handles absolute URL with hash', () => {
    expect(Redirects.appendSearch('https://example.com/docs#intro', '?ref=nav')).toBe(
      'https://example.com/docs?ref=nav#intro',
    )
  })
})

describe('Redirects.from', () => {
  it('compiles simple rules', () => {
    const rules = Redirects.from([
      { source: '/about', destination: '/' },
      { source: '/docs/:path*', destination: '/documentation/:path*' },
    ])

    expect(rules).toMatchInlineSnapshot(`
      [
        {
          "destination": "/",
          "pattern": URLPattern {},
          "source": "/about",
          "status": 307,
        },
        {
          "destination": "/documentation/:path*",
          "pattern": URLPattern {},
          "source": "/docs/:path*",
          "status": 307,
        },
      ]
    `)
  })

  it('uses custom status code', () => {
    const rules = Redirects.from([{ source: '/old', destination: '/new', status: 301 }])

    expect(rules).toMatchInlineSnapshot(`
      [
        {
          "destination": "/new",
          "pattern": URLPattern {},
          "source": "/old",
          "status": 301,
        },
      ]
    `)
  })
})

describe('Redirects.resolve', () => {
  it('resolves exact match', () => {
    const rules = Redirects.from([{ source: '/about', destination: '/info' }])
    const result = Redirects.resolve('/about', rules)

    expect(result).toMatchInlineSnapshot(`
      {
        "destination": "/info",
        "params": {},
        "source": "/about",
        "status": 307,
      }
    `)
  })

  it('resolves with named parameter', () => {
    const rules = Redirects.from([{ source: '/blog/:slug', destination: '/posts/:slug' }])
    const result = Redirects.resolve('/blog/hello-world', rules)

    expect(result).toMatchInlineSnapshot(`
      {
        "destination": "/posts/hello-world",
        "params": {
          "slug": "hello-world",
        },
        "source": "/blog/:slug",
        "status": 307,
      }
    `)
  })

  it('resolves with wildcard parameter', () => {
    const rules = Redirects.from([{ source: '/docs/:path*', destination: '/documentation/:path*' }])
    const result = Redirects.resolve('/docs/getting-started/intro', rules)

    expect(result).toMatchInlineSnapshot(`
      {
        "destination": "/documentation/getting-started/intro",
        "params": {
          "path": "getting-started/intro",
        },
        "source": "/docs/:path*",
        "status": 307,
      }
    `)
  })

  it('resolves with custom status', () => {
    const rules = Redirects.from([{ source: '/old/:slug', destination: '/new/:slug', status: 301 }])
    const result = Redirects.resolve('/old/page', rules)

    expect(result).toMatchInlineSnapshot(`
      {
        "destination": "/new/page",
        "params": {
          "slug": "page",
        },
        "source": "/old/:slug",
        "status": 301,
      }
    `)
  })

  it('returns undefined for no match', () => {
    const rules = Redirects.from([{ source: '/about', destination: '/' }])
    const result = Redirects.resolve('/contact', rules)

    expect(result).toMatchInlineSnapshot(`undefined`)
  })

  it('returns first matching rule', () => {
    const rules = Redirects.from([
      { source: '/docs/:path*', destination: '/v2/:path*' },
      { source: '/docs/legacy/:path*', destination: '/v1/:path*' },
    ])
    const result = Redirects.resolve('/docs/legacy/intro', rules)

    expect(result).toMatchInlineSnapshot(`
      {
        "destination": "/v2/legacy/intro",
        "params": {
          "path": "legacy/intro",
        },
        "source": "/docs/:path*",
        "status": 307,
      }
    `)
  })
})
