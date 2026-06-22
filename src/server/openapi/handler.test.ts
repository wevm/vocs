import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
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

  describe('custom css', () => {
    test('injects an inline CSS string into the shell head, after the bundle styles', async () => {
      const ref = openApi({ spec }, { css: ':root { --vocs-color-accent: #7c3aed }' })
      const html = await (await ref.fetch(new Request('http://localhost/'))).text()
      expect(html).toContain('<style>:root { --vocs-color-accent: #7c3aed }</style>')
      // Custom CSS comes after the design-system stylesheets so it wins.
      expect(html.indexOf('rel="stylesheet"')).toBeLessThan(html.indexOf('<style>'))
    })

    test('omits the inline <style> when no css is configured', async () => {
      const ref = openApi({ spec })
      const html = await (await ref.fetch(new Request('http://localhost/'))).text()
      expect(html).not.toContain('<style>')
    })

    test('reads css from a { file }', async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-openapi-css-'))
      await fs.writeFile(path.join(dir, 'theme.css'), '.body { color: red }')
      const ref = openApi({ spec }, { css: { file: 'theme.css' }, rootDir: dir })
      const html = await (await ref.fetch(new Request('http://localhost/'))).text()
      expect(html).toContain('<style>.body { color: red }</style>')
      await fs.rm(dir, { recursive: true, force: true })
    })

    test('neutralizes a closing </style> tag without corrupting CSS', async () => {
      const ref = openApi(
        { spec },
        { css: 'a > b { color: red } /* </style><script>x</script> */' },
      )
      const html = await (await ref.fetch(new Request('http://localhost/'))).text()
      // `>` combinators are preserved. The closing tags are escaped so they
      // can't break out of the `<style>` block (the opening `<script>` is inert
      // as CSS text once `</style>` can't terminate the block).
      expect(html).toContain('a > b { color: red }')
      expect(html).toContain('<\\/style>')
      expect(html).toContain('<\\/script>')
      expect(html).not.toContain('</style><script>')
    })
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

  describe('markdown', () => {
    test('serves the generated overview at `<intro>.md`', async () => {
      const ref = openApi({ spec, path: '/api' })
      const response = await ref.fetch(new Request('http://localhost/api.md'))
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/markdown')

      const md = await response.text()
      expect(md).toContain('# Demo API')
      expect(md).toContain('## Endpoints')
      expect(md).toContain('- [`GET /pets`](/api/pets#listpets): List pets')
    })

    test('serves a generated category at `<group>.md`', async () => {
      const ref = openApi({ spec, path: '/api' })
      const response = await ref.fetch(new Request('http://localhost/api/pets.md'))
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/markdown')

      const md = await response.text()
      expect(md).toContain('## List pets')
      expect(md).toContain('`GET /pets`')
    })

    test('honors `Accept: text/markdown` without a `.md` suffix', async () => {
      const ref = openApi({ spec, path: '/api' })
      const response = await ref.fetch(
        new Request('http://localhost/api', { headers: { accept: 'text/markdown' } }),
      )
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/markdown')
      expect(await response.text()).toContain('# Demo API')
    })

    test('serves an authored guide page as its own Markdown', async () => {
      const ref = openApi({
        spec,
        path: '/api',
        pages: [{ path: '/guide', content: '---\ntitle: Guide\n---\n# Guide\n\nHello there.' }],
      })
      const response = await ref.fetch(new Request('http://localhost/api/guide.md'))
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/markdown')
      const md = await response.text()
      expect(md).toContain('# Guide')
      expect(md).toContain('Hello there.')
    })

    test('serves Markdown to terminal clients (curl) without a `.md` suffix', async () => {
      const ref = openApi({ spec, path: '/api' })
      const response = await ref.fetch(
        new Request('http://localhost/api', { headers: { 'user-agent': 'curl/8.4.0' } }),
      )
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/markdown')
      expect(await response.text()).toContain('# Demo API')
    })

    test('serves Markdown to AI agents without a `.md` suffix', async () => {
      const ref = openApi({ spec, path: '/api' })
      const response = await ref.fetch(
        new Request('http://localhost/api', { headers: { 'user-agent': 'ChatGPT-User/2.0' } }),
      )
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/markdown')
    })

    test('does not serve Markdown to search engines without a `.md` suffix', async () => {
      const ref = openApi({ spec, path: '/api' })
      const response = await ref.fetch(
        new Request('http://localhost/api', { headers: { 'user-agent': 'Googlebot/2.1' } }),
      )
      expect(response.headers.get('content-type') ?? '').not.toContain('text/markdown')
    })

    test('prefixes overview links with the live host mount', async () => {
      const app = new Hono().basePath('/docs')
      app.route('/', openApi({ spec, path: '/api' }, { fallback: 'next' }))

      const response = await app.request('http://localhost/docs/api.md')
      expect(response.status).toBe(200)
      expect(await response.text()).toContain('](/docs/api/pets#listpets)')
    })
  })
})
