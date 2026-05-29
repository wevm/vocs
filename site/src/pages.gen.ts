// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages } from 'waku/router'

// prettier-ignore
type Page =
  | { path: '/changelog'; render: 'static' }
  | { path: '/deployment/netlify'; render: 'static' }
  | { path: '/deployment/node'; render: 'static' }
  | { path: '/deployment/vercel'; render: 'static' }
  | { path: '/features/agent-support'; render: 'static' }
  | { path: '/features/api-routes'; render: 'static' }
  | { path: '/features/ask-ai'; render: 'static' }
  | { path: '/features/changelog-generation'; render: 'static' }
  | { path: '/features/dynamic-og-images'; render: 'static' }
  | { path: '/features/feedback'; render: 'static' }
  | { path: '/features/layouts'; render: 'static' }
  | { path: '/features/mcp-server'; render: 'static' }
  | { path: '/features/navigation'; render: 'static' }
  | { path: '/features/redirects'; render: 'static' }
  | { path: '/features/rehype-and-remark'; render: 'static' }
  | { path: '/features/render-strategies'; render: 'static' }
  | { path: '/features/search'; render: 'static' }
  | { path: '/features/slots'; render: 'static' }
  | { path: '/features/tailwind'; render: 'static' }
  | { path: '/features/theming'; render: 'static' }
  | { path: '/features/vite'; render: 'static' }
  | { path: '/'; render: 'static' }
  | { path: '/introduction/getting-started'; render: 'static' }
  | { path: '/introduction/project-structure'; render: 'static' }
  | { path: '/introduction/what-is-vocs'; render: 'static' }
  | { path: '/introduction/writing-docs-with-ai'; render: 'static' }
  | { path: '/reference/components'; render: 'static' }
  | { path: '/reference/frontmatter'; render: 'static' }
  | { path: '/reference/hooks'; render: 'static' }
  | { path: '/reference/site-config'; render: 'static' }
  | { path: '/writing/assets'; render: 'static' }
  | { path: '/writing/code-snippets'; render: 'static' }
  | { path: '/writing/frontmatter'; render: 'static' }
  | { path: '/writing/markdown-extensions'; render: 'static' }
  | { path: '/writing/markdown-snippets'; render: 'static' }
  | { path: '/writing/mermaid'; render: 'static' }
  | { path: '/writing/react'; render: 'static' }
  | { path: '/writing/syntax-highlighting'; render: 'static' }
  | { path: '/writing/twoslash'; render: 'static' }

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>
  }
  interface CreatePagesConfig {
    pages: Page
  }
}
