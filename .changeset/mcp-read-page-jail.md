---
"vocs": patch
---

MCP `read_page` now resolves the page under the pages directory and rejects `..` / absolute paths that escape it.
