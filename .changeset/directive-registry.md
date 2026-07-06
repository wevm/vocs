---
"vocs": minor
---

Added `markdown.directives` for registering custom leaf directives (`::name{key=value}`) with a react representation (`component`) and/or a markdown representation (`toMarkdown` — rendered in `llms.txt` and `.md` twins). The built-in `::changelog` now runs through the same registry.
