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
