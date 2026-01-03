import { describe, expect, test } from 'vitest'
import { parse } from './topNav.js'

describe('parse', () => {
  test('returns empty array for undefined topNav', () => {
    expect(parse(undefined, '/docs')).toMatchInlineSnapshot(`[]`)
  })

  test('returns empty array for empty topNav', () => {
    expect(parse([], '/docs')).toMatchInlineSnapshot(`[]`)
  })

  test('marks matching item as active', () => {
    expect(
      parse(
        [
          { text: 'Docs', link: '/docs' },
          { text: 'Blog', link: '/blog' },
        ],
        '/docs/getting-started',
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "active": true,
          "link": "/docs",
          "text": "Docs",
        },
        {
          "active": false,
          "link": "/blog",
          "text": "Blog",
        },
      ]
    `)
  })

  test('only one parent is active at a time (last match wins)', () => {
    expect(
      parse(
        [
          { text: 'Docs', link: '/docs' },
          { text: 'API', link: '/docs/api' },
        ],
        '/docs/api/reference',
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "active": false,
          "link": "/docs",
          "text": "Docs",
        },
        {
          "active": true,
          "link": "/docs/api",
          "text": "API",
        },
      ]
    `)
  })

  test('marks child item and parent as active', () => {
    expect(
      parse(
        [
          { text: 'Docs', link: '/docs' },
          {
            text: 'Products',
            items: [
              { text: 'Product A', link: '/products/a' },
              { text: 'Product B', link: '/products/b' },
            ],
          },
        ],
        '/products/a/details',
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "active": false,
          "link": "/docs",
          "text": "Docs",
        },
        {
          "active": true,
          "items": [
            {
              "active": true,
              "link": "/products/a",
              "text": "Product A",
            },
            {
              "active": false,
              "link": "/products/b",
              "text": "Product B",
            },
          ],
          "text": "Products",
        },
      ]
    `)
  })

  test('last match wins over earlier match', () => {
    expect(
      parse(
        [
          { text: 'Products', match: '/products', link: '/products' },
          {
            text: 'Product A',
            items: [{ text: 'Details', link: '/products/a' }],
          },
        ],
        '/products/a/info',
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "active": false,
          "link": "/products",
          "match": "/products",
          "text": "Products",
        },
        {
          "active": true,
          "items": [
            {
              "active": true,
              "link": "/products/a",
              "text": "Details",
            },
          ],
          "text": "Product A",
        },
      ]
    `)
  })

  test('no items active when path does not match', () => {
    expect(
      parse(
        [
          { text: 'Docs', link: '/docs' },
          { text: 'Blog', link: '/blog' },
        ],
        '/other',
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "active": false,
          "link": "/docs",
          "text": "Docs",
        },
        {
          "active": false,
          "link": "/blog",
          "text": "Blog",
        },
      ]
    `)
  })

  test('handles undefined path', () => {
    expect(parse([{ text: 'Docs', link: '/docs' }], undefined)).toMatchInlineSnapshot(`
      [
        {
          "active": false,
          "link": "/docs",
          "text": "Docs",
        },
      ]
    `)
  })

  test('exact path match', () => {
    expect(
      parse(
        [
          { text: 'Home', link: '/' },
          { text: 'Docs', link: '/docs' },
        ],
        '/docs',
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "active": false,
          "link": "/",
          "text": "Home",
        },
        {
          "active": true,
          "link": "/docs",
          "text": "Docs",
        },
      ]
    `)
  })

  test('last matching item wins with multiple matches', () => {
    expect(
      parse(
        [
          { text: 'Docs', link: '/docs' },
          { text: 'API', link: '/docs/api' },
          { text: 'Reference', link: '/docs/api/reference' },
        ],
        '/docs/api/reference/endpoints',
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "active": false,
          "link": "/docs",
          "text": "Docs",
        },
        {
          "active": false,
          "link": "/docs/api",
          "text": "API",
        },
        {
          "active": true,
          "link": "/docs/api/reference",
          "text": "Reference",
        },
      ]
    `)
  })
})
