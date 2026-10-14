import { createContext, runInContext } from 'node:vm'
import type { Plugin } from 'vite'
import type { ModuleRunner } from 'vite/module-runner'
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

test('HTML transform preserves Vocs metadata without requiring RC.2 plugin exports', async () => {
  const { createServer } = await import('vite')
  const { htmlTransform } = await import('./vite-plugins.js')
  const server = await createServer({
    configFile: false,
    plugins: [htmlTransform()],
    server: { middlewareMode: true, watch: null },
  })
  try {
    const module = await server.ssrLoadModule('virtual:vite-rsc-waku/html-transform')
    expect(module).toHaveProperty('default', undefined)
  } finally {
    await server.close()
  }
})

test('server source maps map stack frames without Node caching runner maps', async () => {
  const fs = await import('node:fs/promises')
  const { createRequire, findSourceMap } = await import('node:module')
  const os = await import('node:os')
  const path = await import('node:path')
  const { createServer, isRunnableDevEnvironment, transformWithOxc } = await import('vite')
  const { serverSourceMaps } = await import('./vite-plugins.js')

  const source = `type Value = { label: string }

export function boom(): never {
  const value: Value = { label: 'boom' }
  throw new Error(value.label)
}
`
  const stackOf = (fn: () => unknown) => {
    try {
      fn()
    } catch (error) {
      return (error as Error).stack ?? ''
    }
    return ''
  }
  const withRunner = async <value>(
    plugins: Plugin[],
    fn: (runner: ModuleRunner) => Promise<value>,
  ) => {
    const server = await createServer({
      configFile: false,
      root: dir,
      logLevel: 'silent',
      plugins,
      server: { middlewareMode: true, watch: null },
    })
    try {
      const environment = server.environments.ssr
      if (!isRunnableDevEnvironment(environment)) throw new Error('Expected a runnable environment')
      return await fn(environment.runner)
    } finally {
      await server.close()
    }
  }

  const dir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-source-maps-')))
  const enabled = process.sourceMapsEnabled
  const prepareStackTrace = Error.prepareStackTrace
  process.setSourceMapsEnabled(true)
  try {
    const viteFile = path.join(dir, 'vite.ts')
    const vocsFile = path.join(dir, 'vocs.ts')
    await fs.writeFile(viteFile, source)
    await fs.writeFile(vocsFile, source)

    // Files Node loads itself (e.g. through tsx) have maps that only Node holds.
    const nativeFile = path.join(dir, 'native.ts')
    const { code, map } = await transformWithOxc(source, nativeFile, { sourcemap: true })
    const nativeOutput = path.join(dir, 'native.cjs')
    const body = `${code.replace('export function', 'function')}\nmodule.exports = { boom }\n`
    const inlineMap = Buffer.from(JSON.stringify(map)).toString('base64')
    await fs.writeFile(
      nativeOutput,
      `${body}//# sourceMappingURL=data:application/json;base64,${inlineMap}\n`,
    )
    const native = createRequire(import.meta.url)(nativeOutput)
    await fs.writeFile(nativeOutput, body)

    // Vitest maps its own stacks; use Node's mapping as Vite's default runner does.
    Reflect.deleteProperty(Error, 'prepareStackTrace')
    const viteStack = await withRunner([], async (runner) =>
      stackOf((await runner.import(viteFile)).boom),
    )
    Error.prepareStackTrace = prepareStackTrace
    expect(viteStack).toContain(`${viteFile}:5:9`)
    expect(findSourceMap(viteFile)).toBeDefined()

    const [vocsStack, nativeStack] = await withRunner([serverSourceMaps()], async (runner) => [
      stackOf((await runner.import(vocsFile)).boom),
      stackOf(native.boom),
    ])
    expect(vocsStack).toContain(`${vocsFile}:5:9`)
    expect(findSourceMap(vocsFile)).toBeUndefined()
    expect(nativeStack).toContain(`${nativeFile}:5:9`)
  } finally {
    process.setSourceMapsEnabled(enabled)
    Error.prepareStackTrace = prepareStackTrace
    await fs.rm(dir, { recursive: true, force: true })
  }
})
