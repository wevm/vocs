---
"vocs": patch
---

Added an entry for each Workers-safe `vocs/server` module, such as `vocs/server/negotiation` and `vocs/server/llms`, so apps can import one module without loading the rest of the barrel. Importing `vocs/server` in a Vite dev server with `ssr.noExternal` could exhaust memory.
