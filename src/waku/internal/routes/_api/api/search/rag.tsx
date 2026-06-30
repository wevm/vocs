import * as Config from '../../../../../../internal/config.js'
import * as Rag from '../../../../../../internal/rag.js'

/**
 * POST /api/search/rag - Semantic (RAG) search.
 *
 * Embeds the query server-side, searches the built-in static vector index, and
 * optionally synthesizes a cited answer. Embedding/LLM adapters (and their
 * secrets) live in server-only `config._rag` and never reach the client.
 */
export async function POST(request: Request) {
  const config = await Config.resolve({ server: true })
  return Rag.handleSearchRequest(request, config)
}
