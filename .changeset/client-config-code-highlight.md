---
"vocs": patch
---

Stopped sending `codeHighlight.langs` to the browser and included `codeHighlight.engine`. The browser loads grammars on demand, so configured grammars (which can be megabytes, such as Ruby and its embedded languages) no longer bloat the client config, and `engine: 'highlights'` now also applies to client-rendered code blocks.
