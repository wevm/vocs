# vocs

## 2.0.6

### Patch Changes

- 071b04b: Added a `badge` field to `SidebarItem`. Pass a string for a default badge, or an object with a `variant` (`note`, `info`, `tip`, `warning`, `danger`, `success`) for a colored variant. Renders to the right of the item text on leaf items and group headers.

## 2.0.5

### Patch Changes

- e25757c: Reduced peak build-time memory and improved twoslash cache reuse on large docs sites.

## 2.0.4

### Patch Changes

- c88d1d2: Fixed unhandled text directives inside link labels rendering as empty elements.

## 2.0.3

### Patch Changes

- f98e301: Preserved the configured base path root when normalizing Waku's trailing slash base path.

## 2.0.2

### Patch Changes

- f850193: Improved MDX development hot updates to avoid delayed or stale page updates after edits.

## 2.0.1

### Patch Changes

- 691e378: Fixed theme toggles so explicit light and dark selections overrode compiled `light-dark()` theme tokens instead of continuing to follow the system preference.

## 2.0.0

### Major Changes

- db0b626: Released v2

### Patch Changes

- Updated dependencies [db0b626]
  - @vocs/twoslash-rust@0.1.0

## 2.0.0-rc.3

### Patch Changes

- b299b71: Fixed `show-wrap` code annotations to render code blocks wrapped by default.
- b299b71: Added spacing between code group preview elements and main heading dividers.
- b299b71: Enabled default link prefetching in development.
- b299b71: Fixed escaped snippet notation rendering in code examples.
- b299b71: Fixed `Callout` component styles when rendered directly from MDX.
- b299b71: Fixed file tree comments, alignment, wrapping, and guide lines for nested entries.
- b299b71: Ordered generated `llms.txt` content from sidebar navigation.
- 0d519f5: Fixed adjacent Twoslash custom tag comments rendering as separated log rows.

## 2.0.0-rc.2

### Patch Changes

- 10fca6f: Delayed viewport link prefetching by two seconds after page load and preserved immediate hover and click prefetching.

## 2.0.0-rc.1

### Patch Changes

- b686dc0: Fixed markdown routing for `partial-static` builds.
