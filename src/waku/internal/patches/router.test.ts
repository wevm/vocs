import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Frontmatter } from '../../../internal/config.js'
import { getApiHandlers, hasInvalidStaticApiExports } from './api-routes.js'
import { router } from './router.js'

const routerMocks = vi.hoisted(() => ({
  callback: undefined as
    | ((tools: {
        createApi: ReturnType<typeof vi.fn>
        createLayout: ReturnType<typeof vi.fn>
        createPage: ReturnType<typeof vi.fn>
        createRoot: ReturnType<typeof vi.fn>
        createSlice: ReturnType<typeof vi.fn>
      }) => Promise<unknown>)
    | undefined,
  config: {
    openapi: [{ path: '/api' }],
  },
  specs: {
    '/api': {
      groups: [{ id: 'payments', pagePath: undefined as string | undefined }],
    },
  },
}))

vi.mock('waku/router/server', () => ({
  createPages: (callback: NonNullable<typeof routerMocks.callback>) => {
    routerMocks.callback = callback
    return {
      handleBuild: vi.fn(),
      handleRequest: vi.fn(),
    }
  },
}))

vi.mock('virtual:vocs/config', () => ({
  get config() {
    return routerMocks.config
  },
}))

vi.mock('virtual:vocs/openapi', () => ({
  get specs() {
    return routerMocks.specs
  },
}))

vi.mock('../../../react/internal/openapi/OpenApiPage.js', () => ({
  OpenApiGuide: () => null,
  OpenApiPage: () => null,
}))

const POST = async () => new Response(null)
const GET = async () => new Response(null)

beforeEach(() => {
  routerMocks.callback = undefined
  routerMocks.specs['/api'].groups = [{ id: 'payments', pagePath: undefined }]
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getApiHandlers', () => {
  it('ignores non-function synthetic exports', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const handlers = getApiHandlers({ POST, t: { id: 123 } }, '/_api/faucet')

    expect(handlers).toEqual({ POST })
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns on exported helper functions', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fund = async () => new Response(null)

    const handlers = getApiHandlers({ POST, fund }, '/_api/faucet')

    expect(handlers).toEqual({ POST })
    expect(warn).toHaveBeenCalledWith(
      'API /_api/faucet has an invalid export: fund. Valid exports are: GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH',
    )
  })

  it('maps default exports to all handlers', () => {
    const handler = async () => new Response(null)

    expect(getApiHandlers({ default: handler }, '/_api/faucet')).toEqual({ all: handler })
  })
})

describe('hasInvalidStaticApiExports', () => {
  it('ignores non-function synthetic exports', () => {
    expect(hasInvalidStaticApiExports({ GET, t: { id: 123 } })).toBe(false)
  })

  it('rejects non-GET route handlers and helper functions', () => {
    const fund = async () => new Response(null)

    expect(hasInvalidStaticApiExports({ GET, POST })).toBe(true)
    expect(hasInvalidStaticApiExports({ GET, fund })).toBe(true)
  })
})

describe('router OpenAPI metadata', () => {
  it('mounts category pages at configured page paths', async () => {
    routerMocks.specs['/api'].groups = [{ id: 'funding-transfers', pagePath: 'funding/transfers' }]

    const pages = await createRouterPages({})

    expect(pages.map((page) => page.path)).toContain('/api/funding/transfers')
    expect(pages.map((page) => page.path)).not.toContain('/api/funding-transfers')
  })

  it('forwards complete frontmatter for authored landing and child pages', async () => {
    const landingFrontmatter = {
      author: 'Tempo',
      description: 'Explore the Tempo API.',
      socialImage: 'https://example.com/api.png',
      title: 'Tempo API Reference',
    } satisfies Frontmatter
    const childFrontmatter = {
      description: 'Authenticate Tempo API requests.',
      lastModified: '2026-07-28T00:00:00.000Z',
      title: 'Authentication',
    } satisfies Frontmatter
    const Content = () => null

    const pages = await createRouterPages({
      './pages/api.mdx': async () => ({
        default: Content,
        frontmatter: landingFrontmatter,
      }),
      './pages/api/authentication.mdx': async () => ({
        default: Content,
        frontmatter: childFrontmatter,
      }),
    })

    const landing = pages.find((page) => page.path === '/api')
    const child = pages.find((page) => page.path === '/api/authentication')

    expect(landing?.component().props).toMatchObject({
      frontmatter: landingFrontmatter,
      title: 'Tempo API Reference',
    })
    expect(child?.component().props).toMatchObject({
      frontmatter: childFrontmatter,
      title: 'Authentication',
    })
  })
})

async function createRouterPages(
  modules: Record<string, () => Promise<unknown>>,
): Promise<{ component: () => ReactElement<Record<string, unknown>>; path: string }[]> {
  const createPage = vi.fn()
  const Empty = () => null
  const builtInModules = Object.fromEntries(
    [
      './pages/404.tsx',
      './pages/_api/api/feedback.tsx',
      './pages/_api/api/mcp.tsx',
      './pages/_api/api/og.tsx',
      './pages/_api/api/search.tsx',
      './pages/_root.tsx',
    ].map((file) => [file, async () => ({ default: Empty })]),
  )
  router({ ...builtInModules, ...modules })
  await routerMocks.callback?.({
    createApi: vi.fn(),
    createLayout: vi.fn(),
    createPage,
    createRoot: vi.fn(),
    createSlice: vi.fn(),
  })
  return createPage.mock.calls.map(([page]) => page)
}
