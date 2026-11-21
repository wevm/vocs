---
"vocs": patch
---

Fixed a code block in a language Shiki doesn't bundle failing every page. `Langs.infer` now skips the language and warns with the file name, and the block renders as plain text.
