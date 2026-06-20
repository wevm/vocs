---
"vocs": minor
---

Added OpenAPI integration. Mount an interactive API reference from an OpenAPI
spec via the `openapi` config option (e.g. `openapi: [{ spec, path: '/api' }]`).
Vocs generates an isolated section with its own sidebar, one page per tag/domain
(endpoints as in-page anchors), request/response code samples, and bidirectional
linking between schema/parameter docs and the example panel.
