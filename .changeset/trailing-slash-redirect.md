---
"vocs": patch
---

Add `trailingSlashRedirect` config option (default `true`). Set to `false` when an upstream host (reverse proxy / CDN) owns trailing-slash canonicalization — Vocs then normalizes `/foo/` to `/foo` internally for routing instead of emitting a 308 redirect, which avoids redirect loops when the upstream adds trailing slashes.
