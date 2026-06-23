---
"vocs": patch
---

Fixed sidebar active state being lost when scrolling on OpenAPI guide pages (e.g. an authored "Authentication" page mounted under an OpenAPI section). Page-level sidebar items now only defer their active state to in-page anchors that have a corresponding hash-link sidebar item, instead of any heading on the page.
