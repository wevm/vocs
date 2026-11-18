---
"vocs": minor
---

Added Workers-safe modules to `vocs/server` that any Hono app can import: `Negotiation` (Markdown content negotiation and middleware, now shared by the `.md` router and `Handler.openApi`), `Llms` (`llms.txt` formatters with a runtime origin), `MarkdownRender` (MDX to Markdown renderer engine), `Sitemap`, `Feed`, and `SearchFusion`.

Markdown negotiation now honors `Accept` q-values, serves HTML to terminal clients that ask for `text/html`, serves `llms.txt` to AI agents on `/`, resolves `/foo/index.md`, returns `404` Markdown for unknown `.md` paths, negotiates only `GET` and `HEAD`, sends `Link: rel="canonical"`, and recognizes `Claude-User` and `Claude-SearchBot`. Pages link their Markdown with `<link rel="alternate" type="text/markdown">`, and sitemap `<loc>` values are XML-escaped.
