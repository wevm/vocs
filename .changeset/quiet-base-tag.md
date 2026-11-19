---
"vocs": patch
---

Stopped `baseUrl` from injecting a `<base>` tag into every page, which broke client scripts when a site was served from another host (for example a preview deployment). The tag is now only emitted when `head.base` is set explicitly. Sites that relied on the implicit tag should set `head: { base: '<url>' }`.
