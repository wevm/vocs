---
"vocs": patch
---

Fixed `VectorStore.cloudflare` pruning failing with error 40007 by batching deletes at Vectorize's 100-id limit.
