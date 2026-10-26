---
"vocs": minor
---

Added OpenAPI `sidebar` options to shape the generated sidebar without editing the spec: `groupItems` adds links inside a tag group (after its Overview link), `tagGroupItems` adds links at the top of an `x-tagGroups` section, `hide` leaves tags or sections out of the sidebar while keeping their pages, and `introduction: false` renders `intro` items at the top level instead of under a generated Introduction entry.
