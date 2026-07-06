---
"vocs": minor
---

Added a `_directives.tsx` convention for registering custom leaf directives (`::name{key=value}`), each with a react representation (`component` — `use client` supported) and/or a markdown representation (`toMarkdown` — rendered in `llms.txt` and `.md` twins). The built-in `::changelog` now runs through the same registry.
