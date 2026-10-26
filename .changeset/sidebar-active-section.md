---
"vocs": minor
---

Fixed the sidebar's active in-page section. It now follows the last linked heading that reached the top of the viewport, so it stays correct when scrolling up or jumping over several sections, ignores hash links to other pages, and matches percent-encoded fragments. Active sidebar links now set `aria-current` (`page` for pages, `location` for in-page sections).

Added the `useActiveSidebarAnchor` hook so custom navigation can track the same active section.
