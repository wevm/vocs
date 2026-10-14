import { AsyncResource } from 'node:async_hooks'
import type { Plugin } from 'vite'

type CrawlEndFinder = {
  registerRequestProcessing: (id: string, done: () => Promise<unknown>) => void
  waitForRequestsIdle: (ignoredId?: string) => Promise<void>
}

// Vite's crawl-end finder keeps its last timer, and a timer created during a request
// keeps that request's async context (and its whole React render) alive.
export function crawlEndContextPlugin(): Plugin {
  return {
    name: 'vocs:crawl-end-context',
    apply: 'serve',
    configureServer(server) {
      const scope = new AsyncResource('vocs:crawl-end')
      for (const environment of Object.values(server.environments)) {
        const finder = (environment as { _crawlEndFinder?: Partial<CrawlEndFinder> })
          ._crawlEndFinder
        const { registerRequestProcessing, waitForRequestsIdle } = finder ?? {}
        if (!finder || !registerRequestProcessing || !waitForRequestsIdle) continue
        // The request work itself keeps running in the request's context.
        finder.registerRequestProcessing = (id, done) =>
          scope.runInAsyncScope(registerRequestProcessing, finder, id, AsyncResource.bind(done))
        finder.waitForRequestsIdle = (ignoredId) =>
          scope.runInAsyncScope(waitForRequestsIdle, finder, ignoredId)
      }
    },
  }
}
