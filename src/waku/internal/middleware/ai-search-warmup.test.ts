import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock Config.resolve / Retriever.ensureServerIndex so we can observe the
// warm-up kick without a real vocs config or index build.
vi.mock('../../../internal/config.js', async () => {
  const actual = await vi.importActual<typeof import('../../../internal/config.js')>(
    '../../../internal/config.js',
  )
  return { ...actual, resolve: vi.fn() }
})
vi.mock('../../../internal/retriever.js', async () => {
  const actual = await vi.importActual<typeof import('../../../internal/retriever.js')>(
    '../../../internal/retriever.js',
  )
  return { ...actual, ensureServerIndex: vi.fn() }
})

import * as Config from '../../../internal/config.js'
import * as Retriever from '../../../internal/retriever.js'
import { aiSearchWarmup } from './ai-search-warmup.js'

const mockResolve = vi.mocked(Config.resolve)
const mockEnsure = vi.mocked(Retriever.ensureServerIndex)

afterEach(() => vi.resetAllMocks())

/** Creates a Hono app with the warmup middleware and a catch-all handler. */
function createApp() {
  const app = new Hono()
  app.use('*', aiSearchWarmup())
  app.get('*', (c) => c.text('ok'))
  return app
}

function localConfig(target: 'static' | 'remote' = 'static') {
  // The middleware checks `_localRetriever` presence and the vector-store target.
  return { _localRetriever: { vectorStore: { target } } } as unknown as Config.Config
}

/** Lets the fire-and-forget warm-up chain settle. */
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 10))
}

describe('aiSearchWarmup', () => {
  it('kicks off the index build once, without blocking requests', async () => {
    mockResolve.mockResolvedValue(localConfig())
    mockEnsure.mockReturnValue({ status: 'ready', promise: Promise.resolve() } as never)

    const app = createApp()
    expect(await (await app.request('http://localhost/')).text()).toBe('ok')
    await vi.waitFor(() => expect(mockEnsure).toHaveBeenCalledTimes(1))
    expect(mockEnsure.mock.calls[0]?.[1]?.loadManifest).toBeTypeOf('function')

    // Subsequent requests don't re-kick the warm-up.
    await app.request('http://localhost/docs')
    await settle()
    expect(mockEnsure).toHaveBeenCalledTimes(1)
  })

  it('skips when no local retriever is configured', async () => {
    mockResolve.mockResolvedValue({} as Config.Config)

    const app = createApp()
    expect((await app.request('http://localhost/')).status).toBe(200)
    await settle()
    expect(mockEnsure).not.toHaveBeenCalled()
  })

  it('skips for a remote vector store (no in-process index to warm)', async () => {
    mockResolve.mockResolvedValue(localConfig('remote'))

    const app = createApp()
    expect((await app.request('http://localhost/')).status).toBe(200)
    await settle()
    expect(mockEnsure).not.toHaveBeenCalled()
  })

  it('skips in development (dev loads the index lazily)', async () => {
    const prev = process.env['NODE_ENV']
    process.env['NODE_ENV'] = 'development'
    try {
      const app = createApp()
      expect((await app.request('http://localhost/')).status).toBe(200)
      await settle()
      expect(mockResolve).not.toHaveBeenCalled()
      expect(mockEnsure).not.toHaveBeenCalled()
    } finally {
      process.env['NODE_ENV'] = prev
    }
  })

  it('serves requests even when warm-up fails', async () => {
    mockResolve.mockRejectedValue(new Error('no config'))

    const app = createApp()
    expect((await app.request('http://localhost/')).status).toBe(200)
    await settle()
    expect(mockEnsure).not.toHaveBeenCalled()
  })
})
