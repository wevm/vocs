import type { MiddlewareHandler } from 'hono'

/**
 * Warms the local AI search index on the first request of a server instance.
 *
 * Serverless instances build their in-process index lazily, so without
 * warming, the first `/api/search` on each cold instance answers
 * `indexing: true`. Kicking the build off on the first request (usually a
 * page load, well before the user opens search) hides that latency.
 *
 * The build runs within request context (required on Workers-style runtimes,
 * which forbid I/O at module scope) and never blocks the request. Modules are
 * imported lazily so server boot stays lean.
 */
export const aiSearchWarmup = (): MiddlewareHandler => {
  let warmed = false
  return (context, next) => {
    if (!warmed) {
      warmed = true
      const build = warm()
      // Keep the build alive past the response where supported (Workers).
      try {
        context.executionCtx?.waitUntil?.(build)
      } catch {
        // Hono throws when the runtime has no execution context (Node).
      }
    }
    return next()
  }
}

export default aiSearchWarmup

/** Kicks the index build. Best-effort: `/api/search` surfaces real errors. */
async function warm(): Promise<void> {
  try {
    // Dev never builds the index (see `resolveServerIndex`); load it lazily.
    if (process.env['NODE_ENV'] === 'development') return
    const [Config, Retriever, { loadAiSearchManifest }] = await Promise.all([
      import('../../../internal/config.js'),
      import('../../../internal/retriever.js'),
      import('../ai-search.js'),
    ])
    const config = await Config.resolve({ server: true })
    if (!config._localRetriever) return
    // Remote vector store: no in-process index to warm (queried in the database).
    if (config._localRetriever.vectorStore.target === 'remote') return
    await Retriever.ensureServerIndex(config, { loadManifest: loadAiSearchManifest }).promise
  } catch {
    // `ensureServerIndex` already logs build failures.
  }
}
