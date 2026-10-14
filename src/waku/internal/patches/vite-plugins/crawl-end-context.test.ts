import { AsyncLocalStorage } from 'node:async_hooks'
import { expect, test } from 'vitest'
import { crawlEndContextPlugin } from './crawl-end-context.js'

test('creates crawl-end timers outside the request context', async () => {
  const storage = new AsyncLocalStorage<string>()
  const stores: Record<string, string | undefined> = {}
  const finder = {
    registerRequestProcessing(_id: string, done: () => Promise<unknown>) {
      stores['register'] = storage.getStore()
      return done()
    },
    waitForRequestsIdle() {
      stores['idle'] = storage.getStore()
      return Promise.resolve()
    },
  }
  const { configureServer } = crawlEndContextPlugin()
  if (typeof configureServer !== 'function') throw new Error('Expected a callable hook')
  await configureServer.call(
    {} as never,
    { environments: { ssr: { _crawlEndFinder: finder } } } as never,
  )

  await storage.run('request', async () => {
    finder.registerRequestProcessing('/page.mdx', async () => {
      stores['done'] = storage.getStore()
    })
    await finder.waitForRequestsIdle()
  })
  expect(stores).toEqual({ register: undefined, done: 'request', idle: undefined })
})
