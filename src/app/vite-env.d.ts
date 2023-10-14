/// <reference types="vite/client" />

type Page = {
  component: React.ComponentType;
  modulePath: string;
  path: string;
}

declare module 'virtual:pages' {
  export const pages: Page[];
}