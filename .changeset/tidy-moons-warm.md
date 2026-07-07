---
'vocs': patch
---

Warmed the local AI search index on the first request of a server instance and made `/api/search` briefly wait for a pending index before answering `indexing: true`.
