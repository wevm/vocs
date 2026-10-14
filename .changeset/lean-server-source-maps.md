---
"vocs": patch
---

Reduced dev server memory by evaluating server modules without their inline source maps, which Node and V8 each retained, while keeping stack traces mapped to source.
