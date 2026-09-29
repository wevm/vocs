---
"vocs": patch
---

Fixed Ask AI when a `basePath` is configured. "View as Markdown" and "Copy for AI" now request the markdown twin under the base path, and the page and MCP endpoint URLs include it. Serving the twin and `llms.txt` under the base path is fixed on the dev server, Node, and Vercel.
