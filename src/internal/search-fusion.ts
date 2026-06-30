/**
 * Hybrid search fusion — combine keyword (MiniSearch) and semantic (RAG/vector)
 * result lists into a single ranking.
 *
 * Uses weighted **Reciprocal Rank Fusion (RRF)**. RRF ranks by position rather
 * than raw score, so it gracefully merges two lists whose score scales are
 * incompatible (MiniSearch's unbounded BM25-ish scores vs. cosine similarity in
 * `[0, 1]`). Each list contributes `weight / (k + rank)` to an item's fused
 * score; items appearing in both lists accumulate both contributions and rise to
 * the top.
 *
 * Pure and dependency-free so it runs in the browser and is unit-testable.
 */

/**
 * Fuse keyword and semantic result lists into one ranked list, de-duplicated by
 * `href`. When the same `href` appears in both lists, the **keyword** item is
 * kept (it carries match metadata for highlighting) but its position reflects
 * the combined score.
 */
export function fuse<T extends { href: string }>(options: fuse.Options<T>): T[] {
  const { keyword, semantic, keywordWeight = 0.3, semanticWeight = 0.7, k = 60, limit } = options

  const scores = new Map<string, number>()
  const items = new Map<string, T>()

  // Keyword first so its richer object (highlight metadata) wins on ties.
  keyword.forEach((item, rank) => {
    const contribution = keywordWeight / (k + rank + 1)
    scores.set(item.href, (scores.get(item.href) ?? 0) + contribution)
    items.set(item.href, item)
  })
  semantic.forEach((item, rank) => {
    const contribution = semanticWeight / (k + rank + 1)
    scores.set(item.href, (scores.get(item.href) ?? 0) + contribution)
    if (!items.has(item.href)) items.set(item.href, item)
  })

  const ranked = [...items.values()].sort(
    (a, b) => (scores.get(b.href) ?? 0) - (scores.get(a.href) ?? 0),
  )
  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked
}

export declare namespace fuse {
  type Options<T> = {
    /** RRF dampening constant; larger flattens rank influence. @default 60 */
    k?: number | undefined
    /** Keyword (MiniSearch) results, already ranked best-first. */
    keyword: readonly T[]
    /** Weight applied to the keyword list. @default 0.3 */
    keywordWeight?: number | undefined
    /** Cap on the number of fused results returned. */
    limit?: number | undefined
    /** Semantic (RAG/vector) results, already ranked best-first. */
    semantic: readonly T[]
    /** Weight applied to the semantic list. @default 0.7 */
    semanticWeight?: number | undefined
  }
}
