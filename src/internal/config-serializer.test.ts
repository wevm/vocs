import { describe, expect, test } from 'vitest'
import { define } from './config.js'
import { deserialize, forClient, serialize } from './config-serializer.js'

describe('config serializer', () => {
  test('includes browser settings without exposing server paths or MCP sources', () => {
    const config = define({
      rootDir: '/tmp/private-root-sentinel',
      title: 'Public title',
      mcp: {
        enabled: true,
        sources: [
          {
            type: 'custom',
            async listFiles() {
              return []
            },
            async readFile() {
              return 'private-token-sentinel'
            },
            async getTree() {
              return { files: [], truncated: false }
            },
          },
        ],
      },
    })

    const client = forClient(config)
    const serialized = serialize(client)

    expect(client.title).toBe('Public title')
    expect(client.mcp).toEqual({ enabled: true })
    expect(serialized).not.toContain('private-root-sentinel')
    expect(serialized).not.toContain('private-token-sentinel')
    expect(serialized).not.toContain('cacheDir')
    expect(serialized).not.toContain('rootDir')
    expect(serialized).not.toContain('sources')
  })

  test('round trips route-aware head and title callbacks', () => {
    const config = define({
      head: (path) => {
        if (path === '/preview') return false
        if (path.startsWith('/blog')) return { meta: { ogType: 'article' } }
        return undefined
      },
      titleTemplate: (path) => (path.startsWith('/docs') ? '%s · Docs' : '%s · Site'),
    })

    const result = deserialize(serialize(config))

    expect(typeof result.titleTemplate).toBe('function')
    expect(typeof result.head).toBe('function')
    expect(
      typeof result.titleTemplate === 'function' &&
        result.titleTemplate('/docs/intro', {
          frontmatter: undefined,
          siteTitle: 'Docs',
          title: 'Intro',
        }),
    ).toBe('%s · Docs')
    expect(
      typeof result.head === 'function' && result.head('/preview', { frontmatter: undefined }),
    ).toBe(false)
    expect(
      typeof result.head === 'function' && result.head('/blog/post', { frontmatter: undefined }),
    ).toEqual({ meta: { ogType: 'article' } })
  })

  test('round trips route-aware sitemap callbacks', () => {
    const config = define({
      sitemap: {
        include: (path) => !path.startsWith('/internal'),
        lastmod: (path, { lastmod }) => (path.startsWith('/docs') ? false : lastmod),
      },
    })

    const result = deserialize(serialize(config))

    expect(typeof result.sitemap !== 'boolean' && typeof result.sitemap?.include).toBe('function')
    expect(typeof result.sitemap !== 'boolean' && typeof result.sitemap?.lastmod).toBe('function')
    expect(
      typeof result.sitemap !== 'boolean' &&
        typeof result.sitemap?.include === 'function' &&
        result.sitemap.include('/internal/page', { filePath: 'internal/page.mdx' }),
    ).toBe(false)
    expect(
      typeof result.sitemap !== 'boolean' &&
        typeof result.sitemap?.lastmod === 'function' &&
        result.sitemap.lastmod('/docs/intro', {
          filePath: 'docs/intro.mdx',
          lastmod: '2026-01-01',
        }),
    ).toBe(false)
  })
})
