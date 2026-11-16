---
"vocs": patch
---

Excluded `:badge[...]` text from heading anchors (`## Status :badge[Beta]` now gets `#status`, not `#status-beta`), and rendered badges as plain text in the Markdown output instead of the raw directive. Badges inside headings are dropped from the Markdown heading so it matches its anchor.
