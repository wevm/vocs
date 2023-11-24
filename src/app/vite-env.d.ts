/// <reference types="vite/client" />

declare module 'virtual:config' {
  export const config: import('../config.js').ParsedConfig
}

declare module 'virtual:docgen' {
  export const docgen: Record<string, string>
}

declare module 'virtual:routes' {
  export const routes: import('./types.js').Route[]
}

declare module 'virtual:root' {
  export const Root: import('react').ElementType
}
