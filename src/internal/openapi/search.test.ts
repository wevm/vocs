import { describe, expect, test } from 'vitest'
import type { Ir } from './parser.js'
import { toSearchDocuments } from './search.js'

const ir: Ir = {
  path: '/api',
  client: { url: 'https://example.com/openapi.json' },
  info: { title: 'Petstore', description: 'The **best** pet [API](https://x).' },
  servers: [],
  securitySchemes: {},
  groups: [
    {
      id: 'pets',
      name: 'Pets',
      description: 'Manage pets.',
      operations: [
        {
          id: 'listpets',
          method: 'GET',
          path: '/pets',
          summary: 'List pets',
          description: 'Returns all pets.',
          parameters: [
            { name: 'limit', in: 'query', description: 'Max items' },
            { name: 'cursor', in: 'query', deprecated: true },
          ],
          responses: [{ status: '200', description: 'A list of pets', content: [], headers: [] }],
        },
      ],
    },
  ],
}

describe('toSearchDocuments', () => {
  const docs = toSearchDocuments(ir)

  test('emits a landing page, a category page, and an operation section', () => {
    expect(docs.map((doc) => ({ href: doc.href, title: doc.title, type: doc.type }))).toEqual([
      { href: '/api', title: 'Petstore', type: 'page' },
      { href: '/api/pets', title: 'Pets', type: 'page' },
      { href: '/api/pets#listpets', title: 'List pets', type: 'section' },
    ])
  })

  test('landing page strips markdown from the description', () => {
    const landing = docs.find((doc) => doc.href === '/api')
    expect(landing?.text).toBe('The best pet API.')
  })

  test('operation folds method/path, params and responses into searchable text', () => {
    const operation = docs.find((doc) => doc.href === '/api/pets#listpets')
    expect(operation?.subtitle).toBe('GET /pets')
    expect(operation?.titles).toEqual(['Petstore', 'Pets'])
    expect(operation?.text).toContain('GET /pets')
    expect(operation?.text).toContain('Returns all pets.')
    expect(operation?.text).toContain('limit Max items')
    expect(operation?.text).toContain('200 A list of pets')
    // Deprecated parameters are excluded.
    expect(operation?.text).not.toContain('cursor')
  })
})
