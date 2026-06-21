import { Hono } from 'hono'
import { describe, expect, test } from 'vitest'
import { openApi } from './handler.js'

const spec = {
  openapi: '3.1.0',
  info: { title: 'Demo API', version: '1.0.0', description: 'A demo.' },
  servers: [{ url: 'https://api.example.com' }],
  tags: [{ name: 'Pets', description: 'Pet operations' }],
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: 'List pets',
        tags: ['Pets'],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
}

describe('Handler.openApi', () => {
  test('serves the HTML shell with embedded payload', async () => {
    const ref = openApi({ spec })
    const response = await ref.fetch(new Request('http://localhost/'))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')

    const html = await response.text()
    expect(html).toContain('id="vocs-openapi-data"')
    expect(html).toContain('Demo API')
    // Asset references are absolute, prefixed by the inferred mount (root here).
    expect(html).toContain('/_vocs/openapi/')
    // Embedded payload includes the parsed group.
    expect(html).toContain('"Pets"')
    expect(html).toContain('listPets')
  })

  test('serves the prebuilt client bundle', async () => {
    const ref = openApi({ spec })
    const response = await ref.fetch(new Request('http://localhost/_vocs/openapi/client.js'))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('javascript')
    expect(response.headers.get('cache-control')).toContain('immutable')
    const body = await response.text()
    expect(body.length).toBeGreaterThan(0)
  })

  test('serves assets regardless of mount prefix', async () => {
    const ref = openApi({ spec })
    const response = await ref.fetch(new Request('http://localhost/docs/_vocs/openapi/client.js'))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('javascript')
  })

  test('exposes a Node request listener', () => {
    const ref = openApi({ spec })
    expect(typeof ref.listener).toBe('function')
  })

  test('accepts an already-started spec promise', async () => {
    const ref = openApi({ spec: Promise.resolve(spec) })
    const response = await ref.fetch(new Request('http://localhost/'))
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('listPets')
  })

  describe("fallback: 'next'", () => {
    test('renders the reference at the host root, falls through elsewhere', async () => {
      const app = new Hono()
      app.get('/v1/blocks', (c) => c.json({ who: 'api' }))
      app.route('/', openApi({ spec }, { fallback: 'next' }))
      app.notFound((c) => c.json({ error: 'not_found' }, 404))

      // Reference landing page is owned by the handler.
      const landing = await app.request('http://localhost/')
      expect(landing.status).toBe(200)
      expect(landing.headers.get('content-type')).toContain('text/html')
      // Assets resolve back to the root mount.
      expect(await landing.text()).toContain('/_vocs/openapi/')

      // A known section route (the "Pets" group) renders the shell too.
      const group = await app.request('http://localhost/pets')
      expect(group.status).toBe(200)
      expect(group.headers.get('content-type')).toContain('text/html')

      // Bundled assets are served by the handler.
      const asset = await app.request('http://localhost/_vocs/openapi/client.js')
      expect(asset.status).toBe(200)
      expect(asset.headers.get('content-type')).toContain('javascript')

      // The host API route wins.
      const api = await app.request('http://localhost/v1/blocks')
      expect(api.status).toBe(200)
      expect(await api.json()).toEqual({ who: 'api' })

      // An unrelated path falls through to the host notFound (not the shell).
      const missing = await app.request('http://localhost/v1/missing')
      expect(missing.status).toBe(404)
      expect(await missing.json()).toEqual({ error: 'not_found' })
    })

    test('derives the mount prefix from the host basePath', async () => {
      const app = new Hono().basePath('/api')
      app.route('/', openApi({ spec }, { fallback: 'next' }))

      const landing = await app.request('http://localhost/api/')
      expect(landing.status).toBe(200)
      // Asset URLs are prefixed with the host basePath so they route back here.
      expect(await landing.text()).toContain('/api/_vocs/openapi/')

      const asset = await app.request('http://localhost/api/_vocs/openapi/client.js')
      expect(asset.status).toBe(200)
    })
  })
})
