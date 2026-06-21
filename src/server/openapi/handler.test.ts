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
})
