---
"vocs": patch
---

Fixed malformed `::changelog{limit}` values reaching the changelog fetcher as `NaN` instead of falling back to the default limit.
