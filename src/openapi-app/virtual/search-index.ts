import MiniSearch from 'minisearch'
import { toSearchDocuments } from '../../internal/openapi/search.js'
import { searchFields, storeFields, tokenize } from '../../internal/search.client.js'
import { read } from '../payload.js'

/**
 * Backs `virtual:vocs/search-index` in the prebuilt app.
 *
 * Builds an OpenAPI-only MiniSearch index in the browser from the embedded spec
 * (landing/category pages + every operation), serialized to the same JSON shape
 * the real {@link file://../../react/internal/Search.tsx Search} loads.
 */
export async function getSearchIndex(): Promise<string> {
  const index = new MiniSearch({
    fields: [...searchFields],
    storeFields: [...storeFields],
    tokenize,
  })
  index.addAll(toSearchDocuments(read().ir))
  return JSON.stringify(index.toJSON())
}
