---
'vocs': minor
---

Added Waku 1.0 RC compatibility for client bootstrapping, link prefetching, scroll restoration, and MDX hot reload. Requires Waku 1.0.0-rc.0 or later; link prefetch options now accept an options object instead of a boolean, and the re-exported `useRouter` no longer exposes `unstable_events`. Colocated `_actions` directories are excluded from page discovery, and API routes support `QUERY` handlers.
