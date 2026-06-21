import { describe, expect, test } from 'vitest'
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
      },
    ])
    // The trait tag is not rendered as an operation group.
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
