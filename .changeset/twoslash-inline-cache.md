---
"vocs": minor
---

Added an experimental inline Twoslash cache. Set `twoslash.inlineCache` to `true` (or use the `TWOSLASH_INLINE_CACHE` env var) to persist Twoslash results inline in your markdown source as `// @twoslash-cache: ...` comments. The cache travels with your repository, so fresh clones and CI runs start with a warm cache and skip the TypeScript compiler for unchanged blocks. Use `TWOSLASH_INLINE_CACHE_IGNORE=1` to re-generate, or `TWOSLASH_INLINE_CACHE_REMOVE=1` to strip all cache comments.
