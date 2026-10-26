---
"vocs": patch
---

Fixed `logoUrl`, `iconUrl` and page feedback when a `basePath` is configured. Root-absolute logo and icon URLs (such as `/logo.svg`) are now served from under the base path, and the feedback widget posts to `{basePath}/api/feedback`. URLs that already include the base path are left as-is.
