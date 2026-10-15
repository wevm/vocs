---
"vocs": minor
---

Add automatic Markdown output validation with `warn` and `fail` modes, a build-time environment override, and module-level `markdown` component renderers. Component declarations support static props, children, aliases, namespace imports, and site overrides matched by module/export identity.

Generate Markdown links and complete page bodies from one inventory, retain untitled pages with diagnostics, preserve unsupported expressions for validation, and emit a deterministic artifact manifest with deployment verification helpers. `markdown-audit` now honors the configured enforcement mode (default `warn`) and returns structured diagnostics; use `--validation fail` to retain blocking CI behavior.

Support final-output transforms before validation and hashing, and reuse component module loaders with local-source invalidation.

Expose Node-only Markdown generation and verification helpers from `vocs/server/markdown`, keeping them out of the runtime server entrypoint. Validate aggregate metadata and encoded links, resolve directory-index siblings correctly, and reuse Vite alias resolution for negotiated development Markdown.
