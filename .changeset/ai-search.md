---
"vocs": minor
---

Add built-in AI search. Configure `search.rag` for an open-source, self-hosted vector search (chunk → embed → retrieve, with results fused into keyword search and ranked by similarity) or `search.retriever` for a managed backend (e.g. Cloudflare AI Search). New public APIs: `Embedding` (Cloudflare, OpenAI, OpenRouter, Ollama, OpenAI-compatible adapters), `Reranker` (optional cross-encoder rerank), `Retriever` (managed search adapters), and `VectorStore`. External `llms.txt`/sitemap sources can be embedded alongside your docs via `search.rag.sources`, and a new `vocs embeddings generate` command builds the index (also runnable at build time, skippable with `vocs build --no-embeddings`).
