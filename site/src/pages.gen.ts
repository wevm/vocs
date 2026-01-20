// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages, GetConfigResponse } from 'waku/router';


// prettier-ignore
type Page =
| { path: '/'; render: 'static' }
| { path: '/reference/site-config'; render: 'static' }
| { path: '/guide/asset-handling'; render: 'static' }
| { path: '/guide/changelog-generation'; render: 'static' }
| { path: '/guide/changelog'; render: 'static' }
| { path: '/guide/deploy'; render: 'static' }
| { path: '/guide/dynamic-og-images'; render: 'static' }
| { path: '/guide/frontmatter'; render: 'static' }
| { path: '/guide/getting-started'; render: 'static' }
| { path: '/guide/layouts'; render: 'static' }
| { path: '/guide/markdown-extensions'; render: 'static' }
| { path: '/guide/mcp-server'; render: 'static' }
| { path: '/guide/navigation'; render: 'static' }
| { path: '/guide/project-structure'; render: 'static' }
| { path: '/guide/react'; render: 'static' }
| { path: '/guide/theming'; render: 'static' }
| { path: '/guide/twoslash'; render: 'static' }
| { path: '/guide/what-is-vocs'; render: 'static' };

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>;
  }
  interface CreatePagesConfig {
    pages: Page;
  }
}
