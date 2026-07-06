import { describe, expect, test, vi } from 'vitest'
import * as OpenApi from './openapi.js'
import { parse } from './parser.js'

const spec = {
  openapi: '3.1.0',
  info: { title: 'Petstore', version: '1.0.0', description: 'A sample API' },
  servers: [{ url: 'https://api.example.com', description: 'Production' }],
  tags: [
    { name: 'pets', description: 'Pet operations' },
    { name: 'store', description: 'Store operations' },
  ],
  components: {
    securitySchemes: {
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
  },
  paths: {
    '/pets': {
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
      get: {
        operationId: 'listPets',
        summary: 'List pets',
        tags: ['pets'],
        responses: {
          '200': {
            description: 'A list of pets',
            content: { 'application/json': { schema: { type: 'array' } } },
          },
        },
      },
      post: {
        operationId: 'createPet',
        summary: 'Create a pet',
        tags: ['pets'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/pets/{petId}': {
      get: {
        operationId: 'getPet',
        summary: 'Get a pet',
        tags: ['pets'],
        parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'A pet' } },
      },
    },
    '/inventory': {
      get: {
        operationId: 'getInventory',
        summary: 'Get inventory',
        tags: ['store'],
        security: [{ apiKey: [] }],
        responses: { '200': { description: 'Inventory' } },
      },
    },
    '/health': {
      get: { operationId: 'health', summary: 'Health check', responses: { '200': {} } },
    },
  },
}

describe('parse', () => {
  test('groups operations by tag and builds IR', async () => {
    const ir = await parse(OpenApi.from({ spec, path: '/api' }))

    expect(ir.path).toBe('/api')
    expect(ir.info).toEqual({
      title: 'Petstore',
      version: '1.0.0',
      description: 'A sample API',
    })
    expect(ir.servers).toEqual([{ url: 'https://api.example.com', description: 'Production' }])

    // Group order follows document `tags`, then discovered groups (default last).
    expect(ir.groups.map((group) => group.name)).toEqual(['pets', 'store', 'default'])
    expect(ir.groups.map((group) => group.id)).toEqual(['pets', 'store', 'default'])
  })

  test('extracts `x-traitTag` tags as doc-only traits, excluded from groups', async () => {
    const traitSpec = {
      openapi: '3.1.0',
      info: { title: 'Petstore', version: '1.0.0' },
      tags: [
        {
          name: 'Authentication',
          description: 'Use a token.',
          'x-traitTag': true,
          'x-subtitle': 'How auth works.',
        },
        {
          name: 'Rate limits',
          description: 'Per-tag guide.',
          'x-traitTag': true,
          'x-parent': 'pets',
        },
        { name: 'pets', description: 'Pet operations' },
      ],
      paths: {
        '/pets': { get: { operationId: 'listPets', tags: ['pets'], responses: { '200': {} } } },
      },
    }
    const ir = await parse(OpenApi.from({ spec: traitSpec, path: '/' }))

    expect(ir.traits).toEqual([
      {
        id: 'authentication',
        name: 'Authentication',
        description: 'Use a token.',
        subtitle: 'How auth works.',
        parent: undefined,
      },
      {
        id: 'rate-limits',
        name: 'Rate limits',
        description: 'Per-tag guide.',
        subtitle: undefined,
        parent: 'pets',
      },
    ])
    // Trait tags are not rendered as operation groups.
    expect(ir.groups.map((group) => group.name)).toEqual(['pets'])
  })

  test('merges path-level and operation-level parameters', async () => {
    const ir = await parse(OpenApi.from({ spec, path: '/api' }))
    const pets = ir.groups.find((group) => group.name === 'pets')

    const listPets = pets?.operations.find((op) => op.id === 'listpets')
    expect(listPets?.method).toBe('GET')
    expect(listPets?.path).toBe('/pets')
    expect(listPets?.parameters).toEqual([
      {
        name: 'limit',
        in: 'query',
        required: undefined,
        deprecated: undefined,
        description: undefined,
        schema: { type: 'integer' },
      },
    ])

    // `createPet` shares the `/pets` path item, so it inherits the path-level `limit`.
    const createPet = pets?.operations.find((op) => op.id === 'createpet')
    expect(createPet?.parameters.map((p) => p.name)).toEqual(['limit'])

    // `/pets/{petId}` is a separate path item: only its own `petId` applies.
    const getPet = pets?.operations.find((op) => op.id === 'getpet')
    expect(getPet?.parameters.map((p) => p.name)).toEqual(['petId'])
  })

  test('captures request bodies, responses and security', async () => {
    const ir = await parse(OpenApi.from({ spec, path: '/api' }))
    const pets = ir.groups.find((group) => group.name === 'pets')
    const store = ir.groups.find((group) => group.name === 'store')

    const createPet = pets?.operations.find((op) => op.id === 'createpet')
    expect(createPet?.requestBody).toEqual({
      required: true,
      description: undefined,
      content: [{ mediaType: 'application/json', schema: { type: 'object' }, example: undefined }],
    })

    const listPets = pets?.operations.find((op) => op.id === 'listpets')
    expect(listPets?.responses).toEqual([
      {
        status: '200',
        description: 'A list of pets',
        content: [{ mediaType: 'application/json', schema: { type: 'array' }, example: undefined }],
        headers: [],
      },
    ])

    const inventory = store?.operations.find((op) => op.id === 'getinventory')
    expect(inventory?.security).toEqual([{ apiKey: [] }])
    expect(ir.securitySchemes).toEqual({
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    })
  })

  test('untagged operations fall into a default group', async () => {
    const ir = await parse(OpenApi.from({ spec, path: '/api' }))
    const fallback = ir.groups.find((group) => group.name === 'default')
    expect(fallback?.operations.map((op) => op.id)).toEqual(['health'])
  })

  test('omits `tagGroups` when the document has no `x-tagGroups`', async () => {
    const ir = await parse(OpenApi.from({ spec, path: '/api' }))
    expect(ir.tagGroups).toBeUndefined()
  })

  test('resolves `x-tagGroups` to rendered group ids', async () => {
    const ir = await parse(
      OpenApi.from({
        spec: {
          ...spec,
          'x-tagGroups': [
            { name: 'Data API', tags: ['pets'] },
            { name: 'Platform API', tags: ['store'] },
          ],
        },
        path: '/api',
      }),
    )
    expect(ir.tagGroups).toEqual([
      { name: 'Data API', groupIds: ['pets'] },
      { name: 'Platform API', groupIds: ['store'] },
    ])
  })

  test('drops unknown tags, empty sections, and repeat claims from `x-tagGroups`', async () => {
    const ir = await parse(
      OpenApi.from({
        spec: {
          ...spec,
          'x-tagGroups': [
            // `missing` names no rendered group; `pets` resolves.
            { name: 'Data API', tags: ['missing', 'pets'] },
            // Both tags already claimed or unknown → section drops entirely.
            { name: 'Empty', tags: ['pets', 'nope'] },
            // Unnamed entries are ignored.
            { tags: ['store'] },
          ],
        },
        path: '/api',
      }),
    )
    expect(ir.tagGroups).toEqual([{ name: 'Data API', groupIds: ['pets'] }])
  })

  test('omits `tagGroups` when no `x-tagGroups` entry resolves', async () => {
    const ir = await parse(
      OpenApi.from({
        spec: { ...spec, 'x-tagGroups': [{ name: 'Ghost', tags: ['missing'] }] },
        path: '/api',
      }),
    )
    expect(ir.tagGroups).toBeUndefined()
  })

  test('excludes a tag by name, stripping its operations from the client spec', async () => {
    const ir = await parse(OpenApi.from({ spec, path: '/api', exclude: ['store'] }))
    expect(ir.groups.map((group) => group.name)).toEqual(['pets', 'default'])
    const content = (ir.client as { content: Record<string, unknown> }).content
    const paths = content['paths'] as Record<string, unknown>
    expect(paths['/inventory']).toBeUndefined()
    expect(paths['/pets']).toBeDefined()
  })

  test('excludes every tag an excluded `x-tagGroups` section claims', async () => {
    const ir = await parse(
      OpenApi.from({
        spec: {
          ...spec,
          'x-tagGroups': [
            { name: 'Data API', tags: ['pets'] },
            { name: 'Platform API', tags: ['store'] },
          ],
        },
        path: '/api',
        exclude: ['Platform API'],
      }),
    )
    expect(ir.groups.map((group) => group.name)).toEqual(['pets', 'default'])
    expect(ir.tagGroups).toEqual([{ name: 'Data API', groupIds: ['pets'] }])
    const content = (ir.client as { content: Record<string, unknown> }).content
    expect((content['paths'] as Record<string, unknown>)['/inventory']).toBeUndefined()
  })

  test('keeps other methods on a path shared with an excluded tag', async () => {
    const sharedSpec = {
      openapi: '3.1.0',
      info: { title: 'Shared', version: '1.0.0' },
      paths: {
        '/shared': {
          get: { operationId: 'readShared', tags: ['a'], responses: { '200': {} } },
          post: { operationId: 'writeShared', tags: ['b'], responses: { '201': {} } },
        },
      },
    }
    const ir = await parse(OpenApi.from({ spec: sharedSpec, path: '/api', exclude: ['a'] }))
    expect(ir.groups.map((group) => group.name)).toEqual(['b'])
    const content = (ir.client as { content: Record<string, unknown> }).content
    const shared = (content['paths'] as Record<string, Record<string, unknown>>)['/shared']
    expect(shared?.['get']).toBeUndefined()
    expect(shared?.['post']).toBeDefined()
  })

  test('ignores exclude names matching nothing', async () => {
    const ir = await parse(OpenApi.from({ spec, path: '/api', exclude: ['Ghost'] }))
    expect(ir.groups.map((group) => group.name)).toEqual(['pets', 'store', 'default'])
  })

  test('inlines remote specs with relative servers for the API client', async () => {
    const fetch_ = globalThis.fetch
    const remoteSpec = {
      openapi: '3.1.0',
      info: { title: 'Remote API', version: '1.0.0' },
      servers: [{ url: '/', description: 'Relative to the spec host' }],
      paths: {
        '/health': {
          get: { operationId: 'health', summary: 'Health check', responses: { '200': {} } },
        },
      },
    }
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(remoteSpec))) as never
    try {
      const ir = await parse(
        OpenApi.from({ spec: 'https://api.example.com/openapi.json', path: '/api' }),
      )

      expect(ir.servers).toEqual([
        {
          url: 'https://api.example.com',
          description: 'Relative to the spec host',
        },
      ])
      expect(ir.client).toEqual({
        content: expect.objectContaining({
          servers: [
            {
              url: 'https://api.example.com',
              description: 'Relative to the spec host',
            },
          ],
        }),
      })
    } finally {
      globalThis.fetch = fetch_
    }
  })

  test('parses OpenAPI 3.1 top-level `webhooks` as non-callable operations', async () => {
    const webhookSpec = {
      openapi: '3.1.0',
      info: { title: 'Petstore', version: '1.0.0' },
      tags: [{ name: 'Webhooks', description: 'Outbound deliveries.' }],
      paths: {
        '/pets': { get: { operationId: 'listPets', tags: ['pets'], responses: { '200': {} } } },
      },
      webhooks: {
        event: {
          post: {
            summary: 'Webhook event delivery',
            tags: ['Webhooks'],
            parameters: [
              { name: 'x-signature', in: 'header', required: true, schema: { type: 'string' } },
            ],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            responses: { '2xx': { description: 'Delivery acknowledged.' } },
          },
        },
      },
    }
    const ir = await parse(OpenApi.from({ spec: webhookSpec, path: '/api' }))

    const webhooks = ir.groups.find((group) => group.name === 'Webhooks')
    expect(webhooks?.operations).toHaveLength(1)
    const event = webhooks?.operations[0]
    expect(event?.method).toBe('POST')
    expect(event?.path).toBe('event')
    expect(event?.isWebhook).toBe(true)
    expect(event?.summary).toBe('Webhook event delivery')
    expect(event?.requestBody?.content[0]?.schema).toEqual({ type: 'object' })
    // Webhook ids are prefixed so they can't collide with real path operations.
    expect(event?.id).toBe('webhook-post-event')
  })
})

describe('from', () => {
  test('normalizes the mount path', () => {
    expect(OpenApi.from({ spec, path: 'api' }).path).toBe('/api')
    expect(OpenApi.from({ spec, path: '/api/' }).path).toBe('/api')
    expect(OpenApi.from({ spec, path: '/' }).path).toBe('/')
  })

  test('throws on missing spec or path', () => {
    expect(() => OpenApi.from({ spec: undefined as never, path: '/api' })).toThrow()
    expect(() => OpenApi.from({ spec, path: undefined as never })).toThrow()
  })
})
