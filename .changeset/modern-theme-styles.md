---
"vocs": major
---

Replaced bundled Tailwind styles and global design tokens with the Zyzz default theme.

```diff
+import { style } from 'zyzz/default'
+const panel = style({ padding: 4, color: 'foreground' })
-<div className="vocs:p-4 vocs:text-primary" />
+<div {...panel()} />
```
