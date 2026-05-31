---
"vocs": patch
---

Fixed the experimental Twoslash inline cache (`twoslash.inlineCache`) producing permanent cache misses and duplicate `// @twoslash-cache: ...` comments for code blocks that import or `[!include]` virtual files. The included file's own cache comment is now stripped before injection so the host block reads its own cache, the cache key is hashed against the normalized code on both read and write, and an existing cache comment is replaced in place rather than appended.
