---
"vocs": patch
---

Fixed redirects dropping the port from external destinations. A destination such as `http://localhost:8080/:path*` no longer treats `:8080` as a path parameter.
