# vocs

## 2.1.11

### Patch Changes

- 89ee8ca: Fixed custom display tags (`@log`/`@error`/`@warn`/`@annotate`) being stripped instead of rendered in Twoslash `checkOnly` mode, and fixed runs of consecutive tags rendering in reverse order.

## 2.1.10

### Patch Changes

- c166f6c: Fixed sitemap generation overwriting user-provided `public/robots.txt` and `public/sitemap.xml` files.

## 2.1.9

### Patch Changes

- 246fdd0: Stopped flagging OpenAPI-generated routes (the mount overview and per-category pages) as dead links.

## 2.1.8

### Patch Changes

- 1d149af: Fixed OpenAPI section sidebar/routing: forward `sidebar.intro` in the Vite integration, add a `sidebar.backLink` option (default `true`), and mount `_layout` files under OpenAPI sections correctly.

## 2.1.7

### Patch Changes

- 47d40a4: Added `<OpenApi.Operation />` and `<OpenApi.Playground />` components.

## 2.1.6

### Patch Changes

- f273dd2: Fixed sidebar active state being lost when scrolling on OpenAPI guide pages (e.g. an authored "Authentication" page mounted under an OpenAPI section). Page-level sidebar items now only defer their active state to in-page anchors that have a corresponding hash-link sidebar item, instead of any heading on the page.

## 2.1.5

### Patch Changes

- 85f6a38: Added a `resource` prop to `<OpenApi.Endpoints />` that renders a flat list of all endpoints for a single resource (e.g. `<OpenApi.Endpoints resource="rpc" />`).

## 2.1.4

### Patch Changes

- bbf3a4f: Muted disabled Scalar modal request values.

## 2.1.3

### Patch Changes

- 73cad45: Fixed OpenAPI playground requests for remote specs with relative server URLs.

## 2.1.2

### Patch Changes

- 6a1630c: Fixed generated OpenAPI root pages to render endpoint overviews when no custom intro page was provided.

## 2.1.1

### Patch Changes

- 9940d95: Fixed Rust Twoslash rendering by loading the required Shiki languages for Twoslash popovers.

## 2.1.0

### Minor Changes

- 645e182: Added OpenAPI integration.

## 2.0.17

### Patch Changes

- e878574: Fixed persisted Twoslash hovers and completions overlapping following documentation content.

## 2.0.16

### Patch Changes

- 766f960: Fixed production builds for pages that imported Markdown files from outside `src/pages`.

## 2.0.15

### Patch Changes

- 0bc3859: Fixed the MCP Streamable HTTP endpoint hanging on JSON-RPC notifications (e.g. `notifications/initialized`) by acking payloads that contain no requests with `202 Accepted`.
- 75eaf10: Fixed user-configured `remarkPlugins` (e.g. `remark-math`) not being applied during llms and search compilation.
- d9ee887: Fixed multi-second latency when CLI and AI-agent user-agents request static assets (`.json`, `.svg`, etc.) by skipping markdown twin resolution for non-page requests.
- 93c0441: Fixed `vocs dev` crashing on fresh npm/bun installs with a missing `react-server` condition error by keeping `react-server-dom-webpack` bundled in the RSC server environments.
- 699e6b3: Upgraded to `waku@1.0.0-beta.3` and removed the router prefetch patches now fixed upstream.

## 2.0.14

### Patch Changes

- c47b871: Fixed heading subtext breaking when its description contained inline markdown such as inline code or emphasis.

## 2.0.13

### Patch Changes

- 90c536d: Stripped inline Twoslash cache comments and the sitemap from markdown (`.md`/llms) pages.

## 2.0.12

### Patch Changes

- 23ca0df: Added copy-to-clipboard behavior for heading anchor links.

## 2.0.11

### Patch Changes

- c7dcfd0: Fixed inline Twoslash cache comments leaking into rendered code snippets.

## 2.0.10

### Patch Changes

- 60ea522: Improved build performance for Twoslash-heavy sites by highlighting hover popups lazily on the client instead of at build time, significantly reducing build memory and time.

## 2.0.9

### Patch Changes

- 13af527: Fixed the experimental Twoslash inline cache to stay portable across environments with differing local Twoslash options.

## 2.0.8

### Patch Changes

- c94eef9: Fixed the experimental Twoslash inline cache producing permanent misses and duplicate comments for code blocks that import or `[!include]` virtual files.

## 2.0.7

### Patch Changes

- 3597288: Added an experimental inline Twoslash cache (`twoslash.inlineCache`) that persists results in the markdown source as `// @twoslash-cache: ...` comments so the cache travels with the repo.

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
