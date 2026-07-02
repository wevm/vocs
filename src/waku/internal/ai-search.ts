import type * as Retriever from '../../internal/retriever.js'

/**
 * Loads the AI search manifest baked into the server bundle at build time (see
 * the `vocs:ai-search` Vite plugin). Resolves to `undefined` in dev or when AI
 * search is disabled, so callers fall back to the on-disk manifest.
 */
export async function loadAiSearchManifest(): Promise<Retriever.IndexManifest | undefined> {
  const { getAiSearchManifest } = await import('virtual:vocs/ai-search-manifest')
  const json = await getAiSearchManifest()
  return json ? (JSON.parse(json) as Retriever.IndexManifest) : undefined
}
