---
"vocs": minor
---

Add an opt-in `codeHighlight.engine: 'highlights'` engine for MDX code blocks, client-side samples, and hover popups. Retain Vocs' annotation transformers, Twoslash analysis and caching, range decorations, and Shiki HAST output. Skip Shiki grammars for supported languages and initialize the browser Shiki highlighter only for compatibility fallbacks. Custom grammars, unsupported languages and themes, and advanced token options continue to use Shiki.
