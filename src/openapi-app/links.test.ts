import { describe, expect, test } from 'vitest'
import type { Payload } from '../internal/openapi/app.js'
import { createRouter, join } from './links.js'

function payload(path: string): Payload {
  return {
    ir: {
      path,
      client: { content: {} },
      info: { title: 'API' },
      servers: [],
      groups: [
        { id: 'pets', name: 'Pets', operations: [] },
        { id: 'store', name: 'Store', operations: [] },
      ],
      traits: [],
      securitySchemes: {},
    },
    title: 'API',
    sidebar: [],
    pages: [{ path: '/auth', blocks: [] }],
    config: {} as Payload['config'],
  }
}

describe('join', () => {
  test('root base', () => {
    expect(join('/', '/')).toBe('/')
    expect(join('/', '/pets')).toBe('/pets')
  })
  test('nested base', () => {
    expect(join('/api', '/')).toBe('/api')
    expect(join('/api', '/pets')).toBe('/api/pets')
  })
})

describe('createRouter (base /)', () => {
  test('infers mount from a group route', () => {
    const router = createRouter(payload('/'), '/docs/pets')
    expect(router.mount).toBe('/docs')
    expect(router.href('/pets')).toBe('/docs/pets')
    expect(router.href('/pets#listPets')).toBe('/docs/pets#listPets')
    expect(router.href('/')).toBe('/docs')
  })

  test('infers mount from the intro route', () => {
    const router = createRouter(payload('/'), '/docs')
    expect(router.mount).toBe('/docs')
    expect(router.resolve('/docs').route).toBe('/')
    expect(router.resolve('/docs/pets').route).toBe('/pets')
  })

  test('mounted at root', () => {
    const router = createRouter(payload('/'), '/store')
    expect(router.mount).toBe('')
    expect(router.href('/store')).toBe('/store')
    expect(router.href('/')).toBe('/')
  })

  test('mounted at root, on the landing page', () => {
    const router = createRouter(payload('/'), '/')
    expect(router.mount).toBe('')
    // Links must not become protocol-relative (`//pets` → `http://pets/`).
    expect(router.href('/pets')).toBe('/pets')
    expect(router.href('/pets#listPets')).toBe('/pets#listPets')
    expect(router.href('/')).toBe('/')
  })

  test('resolves a guide page route', () => {
    const router = createRouter(payload('/'), '/docs/auth')
    expect(router.mount).toBe('/docs')
    expect(router.resolve('/docs/auth').route).toBe('/auth')
  })
})

describe('createRouter (base /api)', () => {
  test('embeds base in section routes', () => {
    const router = createRouter(payload('/api'), '/docs/api/pets')
    expect(router.mount).toBe('/docs')
    expect(router.href('/api/pets')).toBe('/docs/api/pets')
    expect(router.resolve('/docs/api/pets').route).toBe('/api/pets')
    expect(router.resolve('/docs/api').route).toBe('/api')
  })
})
