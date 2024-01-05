/// <reference types="vite/client" />

declare module 'virtual:blog' {
  export const posts: import('./types.js').BlogPost[]
}

declare module 'virtual:config' {
  export const config: import('../config.js').ParsedConfig
}

declare module 'virtual:routes' {
  export const routes: import('./types.js').Route[]
}

declare module 'virtual:consumer-components' {
  export const Layout: import('react').ElementType
  export const Footer: import('react').ElementType
}

declare module 'virtual:searchIndex' {
  export const getSearchIndex: () => Promise<string>
}
