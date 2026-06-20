import { describe, expect, test } from 'vitest'
import type { Ir } from './parser.js'
import { methodVariant, toSidebar } from './sidebar.js'

const ir: Ir = {
  path: '/api',
  client: { url: 'https://example.com/openapi.json' },
  info: { title: 'Petstore' },
  servers: [],
  securitySchemes: {},
  groups: [
    {
      id: 'pets',
      name: 'pets',
      operations: [
        {
          id: 'listpets',
          method: 'GET',
          path: '/pets',
          summary: 'List pets',
          parameters: [],
          responses: [],
        },
        {
          id: 'createpet',
          method: 'POST',
          path: '/pets',
          parameters: [],
          responses: [],
        },
      ],
    },
  ],
}

describe('toSidebar', () => {
  test('groups are non-link headers; operations anchor onto per-category pages', () => {
    expect(toSidebar(ir)).toEqual([
      // Root "Introduction" links to the section landing page.
      { text: 'Introduction', link: '/api' },
      {
        text: 'pets',
        collapsed: false,
        items: [
          {
            // The category itself is reached via an "Overview" entry; the
            // top-level item is a non-link header.
            text: 'Overview',
            link: '/api/pets',
          },
          {
            text: 'List pets',
            link: '/api/pets#listpets',
            badge: { text: 'GET', variant: 'info' },
          },
          {
            // Falls back to "METHOD path" when there's no summary.
            text: 'POST /pets',
            link: '/api/pets#createpet',
            badge: { text: 'POST', variant: 'success' },
          },
        ],
      },
    ])
  })
})

describe('methodVariant', () => {
  test('maps methods to badge variants', () => {
    expect(methodVariant('GET')).toBe('info')
    expect(methodVariant('POST')).toBe('success')
    expect(methodVariant('PUT')).toBe('warning')
    expect(methodVariant('PATCH')).toBe('warning')
    expect(methodVariant('DELETE')).toBe('danger')
    expect(methodVariant('OPTIONS')).toBe('note')
  })
})
