---
'vocs': minor
---

Added a `:::benchmarks` directive that colors table cells by performance relative to a reference column.

```md
:::benchmarks
| suite | Octane | React |
| --- | --- | --- |
| render | 1x | 2.5x |
| memory | 1x | 0.4x |
:::
```
