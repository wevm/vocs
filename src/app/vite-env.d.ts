/// <reference types="vite/client" />

declare module 'virtual:routes' {
  export const routes: import('./types.js').Route[]
}

declare module 'virtual:root' {
  export const Root: import('react').ElementType
}
