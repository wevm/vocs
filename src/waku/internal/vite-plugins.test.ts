import { createContext, runInContext } from 'node:vm'
import { expect, test, vi } from 'vitest'
import { mdxHmr } from './vite-plugins.js'

test('MDX updates refetch through Waku RC reload listeners', async () => {
  const plugin = mdxHmr()
  const { load, hotUpdate } = plugin
  if (typeof load !== 'function' || typeof hotUpdate !== 'function')
    throw new Error('Expected callable MDX HMR hooks')

  const reload = vi.fn()
  const context = createContext({
    hot: { data: {}, accept: vi.fn() },
    __WAKU_RSC_RELOAD_LISTENERS__: [reload],
  })
  const evaluate = async () => {
    const code = await load.call({} as never, '\0virtual:vocs/mdx-hmr')
    if (typeof code !== 'string') throw new Error('Expected an MDX HMR module')
    runInContext(`(() => { ${code.replaceAll('import.meta.hot', 'hot')} })()`, context)
  }

  await evaluate()
  expect(reload).not.toHaveBeenCalled()

  await hotUpdate.call(
    {
      environment: {
        name: 'client',
        moduleGraph: { getModuleById: () => ({}) },
      },
    } as never,
    { file: '/docs/page.mdx' } as never,
  )
  await evaluate()
  expect(reload).toHaveBeenCalledTimes(1)

  await evaluate()
  expect(reload).toHaveBeenCalledTimes(1)
})

test.each([
  true,
  false,
])('client bootstrap uses Waku root options with hydration=%s', async (hydrate) => {
  const { userEntries } = await import('./vite-plugins.js')
  const plugin = userEntries({ srcDir: 'src' } as never, {} as never)
  if (typeof plugin.load !== 'function') throw new Error('Expected a callable load hook')
  const code = await plugin.load.call({} as never, '\0virtual:vite-rsc-waku/client-entry')
  if (typeof code !== 'string') throw new Error('Expected a client entry module')
  const defaultRootOptions = { onCaughtError: vi.fn() }
  const rootElement = {}
  const document = {}
  const render = vi.fn()
  const hydrateRoot = vi.fn()
  const createRoot = vi.fn(() => ({ render }))
  const context = createContext({
    StrictMode: {},
    Router: {},
    createElement: () => rootElement,
    createRoot,
    hydrateRoot,
    defaultRootOptions,
    document,
    __WAKU_HYDRATE__: hydrate,
  })
  runInContext(code.replace(/^import .*;\n/gm, '').replaceAll('import.meta.hot', 'false'), context)
  if (hydrate) {
    expect(hydrateRoot).toHaveBeenCalledWith(document, rootElement, defaultRootOptions)
    expect(createRoot).not.toHaveBeenCalled()
  } else {
    expect(createRoot).toHaveBeenCalledWith(document, defaultRootOptions)
    expect(render).toHaveBeenCalledWith(rootElement)
    expect(hydrateRoot).not.toHaveBeenCalled()
  }
})
