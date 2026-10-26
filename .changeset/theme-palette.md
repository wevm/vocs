---
"vocs": patch
---

Stop `theme.css` from wiping the importing site's Tailwind color palette, and export it as `vocs/styles/theme.css`. The `--color-*: initial` reset now lives in Vocs's own stylesheet, so sites can `@import 'vocs/styles/theme.css'` after `tailwindcss` and use Vocs tokens (`bg-surface`, `text-heading`, `border-primary`, …) alongside Tailwind's default colors.
