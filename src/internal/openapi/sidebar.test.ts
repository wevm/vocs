import { describe, expect, test } from 'vitest'
import type { Ir } from './parser.js'
import { methodVariant, toSidebar } from './sidebar.js'

const ir: Ir = {
  path: '/api',
  client: { url: 'https://example.com/openapi.json' },
  info: { title: 'Petstore' },
  servers: [],
  securitySchemes: {},
  traits: [],
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

  test('nests intro items under the Introduction group', () => {
    const sidebar = toSidebar(ir, {
      intro: [
        { text: 'Authentication', link: '/api/authentication' },
        { text: 'Versioning', link: '/api/versioning' },
      ],
    })
    expect(sidebar[0]).toEqual({
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/api' },
        { text: 'Authentication', link: '/api/authentication' },
        { text: 'Versioning', link: '/api/versioning' },
      ],
    })
  })

  test('collapses generated category groups but not Introduction', () => {
    const sidebar = toSidebar(ir, {
      intro: [{ text: 'Authentication', link: '/api/authentication' }],
      collapsed: true,
    })
    // Introduction stays expanded.
    expect((sidebar[0] as { collapsed: boolean }).collapsed).toBe(false)
    // Category groups start collapsed.
    expect((sidebar[1] as { collapsed: boolean }).collapsed).toBe(true)
  })

  test('nests claimed groups under collapsible section headers from tagGroups', () => {
    const sectioned: Ir = {
      ...ir,
      groups: [
        ...ir.groups,
        {
          id: 'platform',
          name: 'Platform',
          operations: [
            {
              id: 'listkeys',
              method: 'GET',
              path: '/keys',
              summary: 'List keys',
              parameters: [],
              responses: [],
            },
          ],
        },
      ],
      tagGroups: [
        { name: 'Data API', groupIds: ['pets'] },
        { name: 'Platform API', groupIds: ['platform'] },
      ],
    }
    const sidebar = toSidebar(sectioned, { collapsed: true })
    expect(sidebar.map((item) => item.text)).toEqual(['Introduction', 'Data API', 'Platform API'])
    const section = sidebar[1] as {
      collapsed?: boolean
      items: { text?: string; collapsed?: boolean }[]
    } // prettier-ignore
    expect(section.collapsed).toBe(true)
    expect(section.items.map((item) => item.text)).toEqual(['pets'])
    expect(section.items[0]?.collapsed).toBe(true)
  })

  test('appends groups unclaimed by tagGroups at the top level', () => {
    const sidebar = toSidebar({
      ...ir,
      groups: [
        ...ir.groups,
        { id: 'internal', name: 'Internal', operations: ir.groups[0]?.operations ?? [] },
      ],
      tagGroups: [{ name: 'Data API', groupIds: ['pets'] }],
    })
    expect(sidebar.map((item) => item.text)).toEqual(['Introduction', 'Data API', 'Internal'])
  })

  test('flattened tag groups render their categories in place at the top level', () => {
    const sectioned: Ir = {
      ...ir,
      groups: [
        ...ir.groups,
        {
          id: 'platform',
          name: 'Platform',
          operations: [
            {
              id: 'listkeys',
              method: 'GET',
              path: '/keys',
              summary: 'List keys',
              parameters: [],
              responses: [],
            },
          ],
        },
      ],
      tagGroups: [
        { name: 'Data API', groupIds: ['pets'] },
        { name: 'Platform API', groupIds: ['platform'] },
      ],
    }
    const sidebar = toSidebar(sectioned, { flatten: ['Data API'] })
    // `pets` renders top-level where its section would sit; `Platform API`
    // keeps its static section header.
    expect(sidebar.map((item) => item.text)).toEqual(['Introduction', 'pets', 'Platform API'])
    const pets = sidebar[1] as { collapsed?: boolean }
    const section = sidebar[2] as { collapsed?: boolean; items: { text?: string }[] }
    expect(pets.collapsed).toBe(false)
    expect(section.collapsed).toBeUndefined()
    expect(section.items.map((item) => item.text)).toEqual(['Platform'])
  })

  test('ignores flatten names that match no tag group', () => {
    const sidebar = toSidebar(
      { ...ir, tagGroups: [{ name: 'Data API', groupIds: ['pets'] }] },
      { flatten: ['Nope'] },
    )
    expect(sidebar.map((item) => item.text)).toEqual(['Introduction', 'Data API'])
  })

  test('injects groupExtras after a group Overview link', () => {
    const sidebar = toSidebar(ir, {
      groupExtras: new Map([['pets', [{ text: 'Rate limits', link: '/api/rate-limits' }]]]),
    })
    expect(sidebar[1]).toEqual({
      text: 'pets',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/api/pets' },
        { text: 'Rate limits', link: '/api/rate-limits' },
        {
          text: 'List pets',
          link: '/api/pets#listpets',
          badge: { text: 'GET', variant: 'info' },
        },
        {
          text: 'POST /pets',
          link: '/api/pets#createpet',
          badge: { text: 'POST', variant: 'success' },
        },
      ],
    })
  })
})

describe('webhook badges', () => {
  const webhookIr: Ir = {
    ...ir,
    groups: [
      {
        id: 'webhooks',
        name: 'Webhooks',
        operations: [
          {
            id: 'payment-succeeded',
            method: 'POST',
            path: 'payment.succeeded',
            summary: 'Payment succeeded',
            parameters: [],
            responses: [],
            isWebhook: true,
          },
        ],
      },
    ],
  }

  test('webhook operations get an icon badge instead of the POST method text', () => {
    const sidebar = toSidebar(webhookIr)
    const group = sidebar[1] as { items: { badge?: { icon?: string; text?: string } }[] }
    const badge = group.items[1]?.badge
    expect(badge?.text).toBeUndefined()
    expect(badge?.icon).toContain('<svg')
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
