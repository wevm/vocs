import { describe, expect, test } from 'vitest'
import { fromIr } from './markdown.js'
import type { Ir } from './parser.js'

const ir: Ir = {
  path: '/api',
  client: { url: 'https://example.com/openapi.json' },
  info: { title: 'Petstore', version: '1.0.0', description: 'The **best** pet API.' },
  servers: [{ url: 'https://example.com', description: 'Production' }],
  securitySchemes: {},
  traits: [],
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
            { name: 'limit', in: 'query', description: 'Max items', schema: { type: 'integer' } },
            { name: 'cursor', in: 'query', deprecated: true },
          ],
          responses: [
            {
              status: '200',
              description: 'A list of pets',
              headers: [
                { name: 'X-Total', schema: { type: 'integer' }, description: 'Total count' },
              ],
              content: [
                {
                  mediaType: 'application/json',
                  schema: {
                    type: 'object',
                    required: ['data'],
                    properties: {
                      data: { type: 'array', items: { type: 'object' }, description: 'Pets.' },
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'createpet',
          method: 'POST',
          path: '/pets',
          summary: 'Create pet',
          parameters: [],
          requestBody: {
            required: true,
            content: [
              {
                mediaType: 'application/json',
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: { name: { type: 'string', description: 'Pet name.' } },
                },
              },
            ],
          },
          responses: [{ status: '201', description: 'Created', content: [], headers: [] }],
        },
      ],
    },
  ],
}

describe('fromIr', () => {
  const pages = fromIr(ir)

  test('emits an overview page and one page per category', () => {
    expect(pages.map((page) => ({ path: page.path, title: page.title }))).toEqual([
      { path: '/api', title: 'Petstore' },
      { path: '/api/pets', title: 'Pets' },
    ])
  })

  test('overview lists every category with links to its operations', () => {
    const overview = pages.find((page) => page.path === '/api')
    expect(overview?.content).toContain('# Petstore')
    expect(overview?.content).toContain('Version: `1.0.0`')
    expect(overview?.content).toContain('## Servers')
    expect(overview?.content).toContain('## Endpoints')
    expect(overview?.content).toContain('### Pets')
    expect(overview?.content).toContain('- [`GET /pets`](/api/pets#listpets): List pets')
  })

  test('category page renders params, request body, responses and samples', () => {
    const group = pages.find((page) => page.path === '/api/pets')
    const content = group?.content ?? ''
    expect(content).toContain('## List pets')
    expect(content).toContain('`GET /pets`')
    expect(content).toContain('### Query parameters')
    expect(content).toContain('- `limit` `integer`: Max items')
    // Deprecated parameters are excluded.
    expect(content).not.toContain('cursor')
    expect(content).toContain('### Responses')
    expect(content).toContain('#### `200`: A list of pets')
    expect(content).toContain('- `X-Total` `integer`: Total count')
    expect(content).toContain('- `data` `object[]` _(required)_: Pets.')
    expect(content).toContain('### Request body (required) (`application/json`)')
    expect(content).toContain('- `name` `string` _(required)_: Pet name.')
    expect(content).toContain('### Example request')
    expect(content).toContain('```bash')
    expect(content).toContain('curl')
  })
})
