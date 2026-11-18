/**
 * Search fusion: combine ranked result lists (keyword, semantic, or any other
 * source) into a single ranking.
 *
 * Uses weighted **Reciprocal Rank Fusion (RRF)**. RRF ranks by position rather
 * than raw score, so it gracefully merges lists whose score scales are
 * incompatible (MiniSearch's unbounded BM25-ish scores vs. cosine similarity in
 * `[0, 1]`). Each source contributes `weight / (k + rank)` to an item's fused
 * score; items appearing in several sources accumulate every contribution and
 * rise to the top.
 *
 * Pure and dependency-free so it runs in the browser, on Workers, and is
 * unit-testable.
 */

/**
 * Fuse ranked result lists into one ranked list, de-duplicated by `key`
 * (`href` by default). When the same key appears in several sources, the item
 * from the **earliest** source is kept (put the source with the richest items,
 * such as keyword highlight metadata, first), but its position reflects the
 * combined score.
 *
 * @example
 * ```ts
 * SearchFusion.fuse({
 *   sources: [
 *     { items: keyword, weight: 0.3 },
 *     { items: semantic, weight: 0.7 },
 *     { items: changelog, weight: 0.2 },
 *   ],
 *   limit: 20,
 * })
 * ```
 */
export function fuse<T>(options: fuse.Options<T>): T[] {
  const { k = 60, limit, sources } = options
  const key = options.key ?? ((item: T) => (item as { href: string }).href)

  const scores = new Map<string, number>()
  const items = new Map<string, T>()

  for (const { items: list, weight = 1 } of sources)
    list.forEach((item, rank) => {
      const id = key(item)
      scores.set(id, (scores.get(id) ?? 0) + weight / (k + rank + 1))
      if (!items.has(id)) items.set(id, item)
    })

  // `sort` is stable, so equal scores keep first-seen order.
  const ranked = [...items.entries()]
    .sort(([a], [b]) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0))
    .map(([, item]) => item)
  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked
}

export declare namespace fuse {
  type Options<T> = {
    /** RRF dampening constant; larger flattens rank influence. @default 60 */
    k?: number | undefined
    /** Cap on the number of fused results returned. */
    limit?: number | undefined
    /** Result lists, each already ranked best-first, with its weight. */
    sources: readonly Source<T>[]
  } & (T extends { href: string }
    ? {
        /** Identity used to de-duplicate items across sources. @default item.href */
        key?: ((item: T) => string) | undefined
      }
    : {
        /** Identity used to de-duplicate items across sources. */
        key: (item: T) => string
      })

  type Source<T> = {
    /** Results, already ranked best-first. */
    items: readonly T[]
    /** Weight applied to this source. @default 1 */
    weight?: number | undefined
  }
}

/**
 * Append semantic results below the keyword list (the non-hybrid default),
 * de-duplicated by `href`. Keyword ordering is untouched; semantic-only
 * results follow in their own ranked order.
 */
export function append<T extends { href: string }>(
  keyword: readonly T[],
  semantic: readonly T[],
  limit?: number | undefined,
): T[] {
  const seen = new Set(keyword.map((item) => item.href))
  const out = [...keyword]
  for (const item of semantic) {
    if (seen.has(item.href)) continue
    seen.add(item.href)
    out.push(item)
  }
  return typeof limit === 'number' ? out.slice(0, limit) : out
}
