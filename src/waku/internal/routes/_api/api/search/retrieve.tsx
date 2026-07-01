import * as Config from '../../../../../../internal/config.js'
import * as Retriever from '../../../../../../internal/retriever.js'

/**
 * POST /api/search/retrieve - Semantic search via the configured retriever.
 *
 * Delegates retrieval to a managed backend (e.g. Cloudflare AI Search). The
 * adapter (and its secrets) lives in server-only `config._retriever` and never
 * reaches the client.
 */
export async function POST(request: Request) {
  const config = await Config.resolve({ server: true })
  return Retriever.handleSearchRequest(request, config)
}
