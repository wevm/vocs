---
"vocs": minor
---

Added Workers-safe server modules that any Hono app can import: `vocs/server/negotiation` (Markdown content negotiation and middleware, now shared by the `.md` router and `Handler.openApi`), `vocs/server/llms` (`llms.txt` formatters with a runtime origin), `vocs/server/markdown-render` (MDX to Markdown renderer engine), `vocs/server/sitemap`, `vocs/server/feed`, and `vocs/server/search-fusion`.

Markdown negotiation now honors `Accept` q-values, serves HTML to terminal clients that ask for `text/html`, serves `llms.txt` to AI agents on `/`, resolves `/foo/index.md`, returns `404` Markdown for unknown `.md` paths, negotiates only `GET` and `HEAD`, sends `Link: rel="canonical"`, and recognizes `Claude-User` and `Claude-SearchBot`. Pages link their Markdown with `<link rel="alternate" type="text/markdown">`, and sitemap `<loc>` values are XML-escaped.
