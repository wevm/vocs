---
'vocs': patch
---

Restored generated OpenAPI pages in builds. Server environments again receive the `openapi` entries from `virtual:vocs/config`, which the router reads to register them; browsers still receive only client-facing config.
