---
"vocs": minor
---

Added a `/.well-known/agent.json` discovery manifest for AI agents. The manifest is generated at build time (and served in dev) when `baseUrl` is configured, and ties together the machine-readable surfaces Vocs already emits — `llms.txt`, `llms-full.txt`, and `sitemap.xml` — behind a single predictable well-known path, so agents can discover the docs corpus without guessing at conventional URLs.
