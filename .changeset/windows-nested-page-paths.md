---
"vocs": patch
---

Fixed `vocs build` and `vocs dev` failing with `Bad character escape sequence` on Windows when a page is in a subdirectory. The page path and the `_mdx-wrapper.tsx` layout path are now written into the generated module with forward slashes.
