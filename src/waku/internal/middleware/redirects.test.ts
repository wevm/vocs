import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock Config.resolve so we can inject redirect rules without a real vocs config.
vi.mock('../../../internal/config.js', async () => {
  const actual = await vi.importActual<typeof import('../../../internal/config.js')>(
    '../../../internal/config.js',
  )
  return { ...actual, resolve: vi.fn() }
})

import * as Config from '../../../internal/config.js'
import { redirects } from './redirects.js'

const mockConfig = vi.mocked(Config.resolve)

afterEach(() => vi.resetAllMocks())

function createConfig(options: Config.define.Options = {}) {
  return Config.define(options)
}

/**
 * Creates a Hono app with the redirects middleware and a catch-all handler,
 * then sends a request to the given URL.
 */
function request(url: string) {
  const app = new Hono()
  app.use('*', redirects())
  app.get('*', (c) => c.text('ok'))
  return app.request(url)
}

describe('redirects middleware', () => {
  it('redirects exact path match', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/docs', destination: '/overview' }],
      }),
    )

    const res = await request('http://localhost/docs')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/overview')
  })

  it('uses custom status code', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/old', destination: '/new', status: 301 }],
      }),
    )

    const res = await request('http://localhost/old')
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('/new')
  })

  it('preserves query string on relative destination', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/docs', destination: '/overview' }],
      }),
    )

    const res = await request('http://localhost/docs?ref=nav&lang=en')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/overview?ref=nav&lang=en')
  })

  it('preserves query string on absolute destination', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/spec', destination: 'https://paymentauth.org' }],
      }),
    )

    const res = await request('http://localhost/spec?section=core')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://paymentauth.org?section=core')
  })

  it('does not inherit http:// protocol from reverse proxy', async () => {
    // Behind TLS-terminating proxies (e.g. Vercel), the internal request
    // URL uses http:// even though the client connected over https://.
    // The Location header must be a relative path — not an absolute URL
    // with the wrong protocol.
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/docs', destination: '/overview' }],
      }),
    )

    const res = await request('http://mpp.dev/docs')
    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).toBe('/overview')
    expect(location?.includes('http://')).toBe(false)
  })

  it('redirects to external URL without modification', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/github', destination: 'https://github.com/wevm/vocs' }],
      }),
    )

    const res = await request('http://localhost/github')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://github.com/wevm/vocs')
  })

  it('resolves parameterized paths', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/blog/:slug', destination: '/posts/:slug' }],
      }),
    )

    const res = await request('http://localhost/blog/hello-world')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/posts/hello-world')
  })

  it('resolves wildcard paths', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/docs/:path*', destination: '/v2/:path*' }],
      }),
    )

    const res = await request('http://localhost/docs/getting-started/intro')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/v2/getting-started/intro')
  })

  it('passes through when no redirects configured', async () => {
    mockConfig.mockResolvedValue(createConfig({ redirects: [] }))

    const res = await request('http://localhost/about')
    expect(res.status).toBe(200)
  })

  it('passes through when no rules match', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/old', destination: '/new' }],
      }),
    )

    const res = await request('http://localhost/about')
    expect(res.status).toBe(200)
  })

  it('passes through when redirects is undefined', async () => {
    mockConfig.mockResolvedValue(createConfig())

    const res = await request('http://localhost/anything')
    expect(res.status).toBe(200)
  })

  it('merges query when destination already has query params', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/docs', destination: '/overview?tab=api' }],
      }),
    )

    const res = await request('http://localhost/docs?ref=nav')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/overview?tab=api&ref=nav')
  })

  it('inserts query before destination hash fragment', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/docs', destination: '/overview#intro' }],
      }),
    )

    const res = await request('http://localhost/docs?ref=nav')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/overview?ref=nav#intro')
  })

  it('merges query and preserves hash on absolute destination', async () => {
    mockConfig.mockResolvedValue(
      createConfig({
        redirects: [{ source: '/spec', destination: 'https://paymentauth.org/core?v=2#overview' }],
      }),
    )

    const res = await request('http://localhost/spec?section=challenges')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://paymentauth.org/core?v=2&section=challenges#overview',
    )
  })
})
