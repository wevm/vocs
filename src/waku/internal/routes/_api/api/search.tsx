import * as Config from '../../../../../internal/config.js'
import * as Retriever from '../../../../../internal/retriever.js'

/**
 * POST /api/search - AI search.
 *
 * Dispatches to whichever retriever is configured: the self-owned local vector
 * index or a managed retriever (e.g. Cloudflare AI Search). Adapters and their
 * secrets live in server-only `config._localRetriever` / `config._retriever`
 * and never reach the client.
 */
export async function POST(request: Request) {
  const config = await Config.resolve({ server: true })
  return Retriever.handleSearchRequest(request, config, {
    // Prebuilt manifest baked into the server bundle at build time. Falls back
    // to the on-disk manifest (dev), then to an in-process build.
    async loadManifest() {
      const { getAiSearchManifest } = await import('virtual:vocs/ai-search-manifest')
      const json = await getAiSearchManifest()
      return json ? (JSON.parse(json) as Retriever.IndexManifest) : undefined
    },
  })
}
