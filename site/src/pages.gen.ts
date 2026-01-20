// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages } from 'waku/router';

// prettier-ignore
type Page =
  | { path: '/'; render: 'static' }
  | { path: '/guide/changelog'; render: 'static' }
  | { path: '/guide/what-is-vocs'; render: 'static' }

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>
  }
  interface CreatePagesConfig {
    pages: Page
  }
}
