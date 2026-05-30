import { beforeEach, describe, expect, it, vi } from 'vitest'

type RenderStrategy = 'full-static' | 'partial-static' | 'dynamic'

type CapturedRoute = {
  kind: 'api' | 'layout' | 'page' | 'root' | 'slice'
  value: { path?: string; render?: 'static' | 'dynamic'; id?: string }
}

const state = vi.hoisted(() => ({
  config: { renderStrategy: 'dynamic' as RenderStrategy },
  createPagesFn: undefined as
    | undefined
    | ((fns: {
        createApi: (value: CapturedRoute['value']) => void
        createLayout: (value: CapturedRoute['value']) => void
        createPage: (value: CapturedRoute['value']) => void
        createRoot: (value: CapturedRoute['value']) => void
        createSlice: (value: CapturedRoute['value']) => void
      }) => Promise<unknown>),
}))

vi.mock('virtual:vocs/config', () => ({
  config: state.config,
}))

vi.mock('waku/router/server', () => ({
  createPages: (fn: typeof state.createPagesFn) => {
    state.createPagesFn = fn
    return {
      handleBuild: async () => {},
      handleRequest: async () => {},
    }
  },
}))

beforeEach(() => {
  state.config.renderStrategy = 'dynamic'
  state.createPagesFn = undefined
})

async function collectRoutes(renderStrategy: RenderStrategy) {
  state.config.renderStrategy = renderStrategy

  const { router } = await import('./router.js')
  router({
    './pages/404.tsx': async () => ({ default: function NotFound() {} }),
    './pages/_root.tsx': async () => ({ default: function Root() {} }),
    './pages/docs/_layout.tsx': async () => ({ default: function Layout() {} }),
    './pages/docs/index.mdx': async () => ({ Page: function Page() {} }),
    './pages/_slices/toc.tsx': async () => ({ default: function Slice() {} }),
    './pages/explicit-static.tsx': async () => ({
      default: function ExplicitStatic() {},
      getConfig: () => ({ render: 'static' }),
    }),
  })

  const captured: CapturedRoute[] = []
  await state.createPagesFn?.({
    createApi: (value) => captured.push({ kind: 'api', value }),
    createLayout: (value) => captured.push({ kind: 'layout', value }),
    createPage: (value) => captured.push({ kind: 'page', value }),
    createRoot: (value) => captured.push({ kind: 'root', value }),
    createSlice: (value) => captured.push({ kind: 'slice', value }),
  })

  return captured
}

describe('router render strategy', () => {
  it('uses dynamic routes when renderStrategy is dynamic', async () => {
    const captured = await collectRoutes('dynamic')

    expect(captured).toContainEqual(
      expect.objectContaining({
        kind: 'root',
        value: expect.objectContaining({ render: 'dynamic' }),
      }),
    )
    expect(captured).toContainEqual(
      expect.objectContaining({
        kind: 'layout',
        value: expect.objectContaining({ path: '/docs', render: 'dynamic' }),
      }),
    )
    expect(captured).toContainEqual(
      expect.objectContaining({
        kind: 'page',
        value: expect.objectContaining({ path: '/docs', render: 'dynamic' }),
      }),
    )
    expect(captured).toContainEqual(
      expect.objectContaining({
        kind: 'slice',
        value: expect.objectContaining({ id: 'toc', render: 'dynamic' }),
      }),
    )
    expect(captured).toContainEqual(
      expect.objectContaining({
        kind: 'page',
        value: expect.objectContaining({ path: '/explicit-static', render: 'static' }),
      }),
    )
  })

  it('uses static routes when renderStrategy is partial-static', async () => {
    const captured = await collectRoutes('partial-static')

    expect(captured).toContainEqual(
      expect.objectContaining({
        kind: 'page',
        value: expect.objectContaining({ path: '/docs', render: 'static' }),
      }),
    )
    expect(captured).toContainEqual(
      expect.objectContaining({
        kind: 'layout',
        value: expect.objectContaining({ path: '/docs', render: 'static' }),
      }),
    )
    expect(captured).toContainEqual(
      expect.objectContaining({
        kind: 'slice',
        value: expect.objectContaining({ id: 'toc', render: 'static' }),
      }),
    )
  })
})
