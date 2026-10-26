---
"vocs": patch
---

Stop `theme.css` from wiping the importing site's Tailwind color palette and line heights, and export it as `vocs/styles/theme.css`. The `--color-*` and `--leading-*` resets now live in Vocs's own stylesheet, so sites can `@import 'vocs/styles/theme.css'` after `tailwindcss` and use Vocs tokens (`bg-surface`, `text-heading`, `border-primary`, …) alongside Tailwind's default colors and `leading-*` utilities.
