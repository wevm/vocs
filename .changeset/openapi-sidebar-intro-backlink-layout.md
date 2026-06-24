---
"vocs": patch
---

Fixed OpenAPI section sidebar and routing:

- `sidebar.intro` items are now forwarded into the generated section sidebar from the Vite/site integration (previously only the standalone handler applied them).
- Added a `sidebar.backLink` option (default `true`) to omit the back link at the top of a generated OpenAPI section sidebar.
- `_layout` files mounted under an OpenAPI section are no longer registered as standalone page routes or skipped during mounting, so section layouts apply correctly.
