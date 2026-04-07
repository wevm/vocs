import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { trailingSlash } from './trailing-slash.js'

/**
 * Creates a Hono app with trailing-slash middleware and a catch-all handler,
 * then sends a request to the given path.
 */
function request(path: string) {
  const app = new Hono()
  app.use('*', trailingSlash())
  app.get('*', (c) => c.text('ok'))
  return app.request(path)
}

describe('trailingSlash', () => {
  it('strips trailing slash and redirects with 308', async () => {
    const res = await request('http://localhost/about/')
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('/about')
  })

  it('preserves query string', async () => {
    const res = await request('http://localhost/docs/?ref=nav')
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('/docs?ref=nav')
  })

  it('skips root path', async () => {
    const res = await request('http://localhost/')
    expect(res.status).toBe(200)
  })

  it('skips paths with file extensions', async () => {
    const res = await request('http://localhost/styles.css')
    expect(res.status).toBe(200)
  })

  it('passes through paths without trailing slash', async () => {
    const res = await request('http://localhost/about')
    expect(res.status).toBe(200)
  })

  it('does not inherit http:// protocol from reverse proxy', async () => {
    // Behind TLS-terminating proxies (e.g. Vercel), the internal request
    // URL uses http:// even though the client connected over https://.
    // The Location header must not leak the internal http:// origin.
    const res = await request('http://mpp.dev/about/')
    expect(res.status).toBe(308)
    const location = res.headers.get('location')!
    expect(location).toBe('/about')
    expect(location).not.toContain('http://')
  })

  it('handles deeply nested paths', async () => {
    const res = await request('http://localhost/sdk/typescript/core/')
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('/sdk/typescript/core')
  })
})
