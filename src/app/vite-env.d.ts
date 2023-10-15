/// <reference types="vite/client" />

type Page = {
  modulePath: string
  lazy: () => Promise<any>
  path: string
}

declare module 'virtual:pages' {
  export const pages: Page[]
}
