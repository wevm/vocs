import { beforeEach, describe, expect, test } from 'vitest'
import * as Config from '../config.js'
import type { SidebarItem } from '../sidebar.js'
import * as OpenApi from './openapi.js'
import * as Registry from './registry.js'

const spec = {
  openapi: '3.1.0',
  info: { title: 'Petstore' },
  paths: {
    '/pets': { get: { operationId: 'listPets', tags: ['pets'], responses: { '200': {} } } },
  },
}

function config(sidebar?: Config.Config['sidebar']): Config.Config {
  return Config.define({
    openapi: [OpenApi.from({ spec, path: '/api' })],
    sidebar,
  })
}

beforeEach(() => {
  Registry.invalidate()
})

describe('mergeSidebar', () => {
  test('returns config unchanged when specs not built', () => {
    const cfg = config()
    expect(Registry.mergeSidebar(cfg)).toBe(cfg)
  })

  test('injects the OpenAPI sidebar under the mount path (no user sidebar)', async () => {
    const cfg = config()
    await Registry.build(cfg)

    const merged = Registry.mergeSidebar(cfg)
    const sidebar = merged.sidebar as Record<string, { backLink: boolean; items: SidebarItem[] }>
    expect(Object.keys(sidebar)).toEqual(['/api'])
    const section = sidebar['/api']
    expect(section?.backLink).toBe(true)
    // A root "Introduction" links to the section landing page.
    expect(section?.items[0]).toEqual({ text: 'Introduction', link: '/api' })
    // The category itself is a non-link header; an "Overview" subitem links to it.
    expect(section?.items[1]).toMatchObject({ text: 'pets' })
    expect(section?.items[1]?.link).toBeUndefined()
    expect(section?.items[1]?.items?.[0]).toEqual({ text: 'Overview', link: '/api/pets' })
  })

  test('converts an array sidebar to path-keyed form under "/"', async () => {
    const cfg = config([{ text: 'Home', link: '/' }])
    await Registry.build(cfg)

    const sidebar = Registry.mergeSidebar(cfg).sidebar as Record<string, unknown>
    expect(Object.keys(sidebar).sort()).toEqual(['/', '/api'])
    expect(sidebar['/']).toEqual([{ text: 'Home', link: '/' }])
  })

  test('preserves an existing object sidebar and adds the mount key', async () => {
    const cfg = config({ '/guide': [{ text: 'Intro', link: '/guide' }] })
    await Registry.build(cfg)

    const sidebar = Registry.mergeSidebar(cfg).sidebar as Record<string, unknown>
    expect(Object.keys(sidebar).sort()).toEqual(['/api', '/guide'])
  })

  test('does not mutate the input config', async () => {
    const cfg = config([{ text: 'Home', link: '/' }])
    await Registry.build(cfg)

    Registry.mergeSidebar(cfg)
    expect(Array.isArray(cfg.sidebar)).toBe(true)
  })
})
