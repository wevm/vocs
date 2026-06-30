/// <reference types="unplugin-icons/types/react" />

declare module '*.mdx' {
  export const frontmatter: import('./config.js').Frontmatter
  export function Page(props: Record<string, unknown>): JSX.Element
  export default function MDXContent(props: Record<string, unknown>): JSX.Element
}

declare module '*.md' {
  export const frontmatter: import('./config.js').Frontmatter
  export function Page(props: Record<string, unknown>): JSX.Element
  export default function MDXContent(props: Record<string, unknown>): JSX.Element
}

declare module 'virtual:vocs/config' {
  export const config: import('./config.js').Config
}

declare module 'virtual:vocs/langs' {
  export const langs: import('shiki').LanguageRegistration[]
}

declare module 'virtual:vocs/openapi' {
  export const specs: Record<string, import('./internal/openapi/index.js').Ir>
}

declare module 'virtual:vocs/search-index' {
  export function getSearchIndex(): Promise<string>
}

declare module 'virtual:vocs/rag-index' {
  export function getRagIndex(): Promise<string>
}

declare module 'virtual:vocs/group-icons.css' {}

declare module 'virtual:vocs/group-icons.css?inline' {
  const css: string
  export default css
}

declare module 'virtual:vocs/group-icons.css?url' {
  const url: string | undefined
  export default url
}

declare module 'virtual:vocs/user-styles' {
  const url: string | undefined
  export default url
}

declare module 'virtual:vocs/user-styles?inline' {
  const css: string | undefined
  export default css
}

declare module '*.css' {}

declare module '*.css?url' {
  const url: string
  export default url
}

declare module '*.wasm?url' {
  const url: string
  export default url
}

declare module '*?arraybuffer' {
  const data: ArrayBuffer
  export default data
}

declare module 'virtual:vocs/slots' {
  import type { ComponentType } from 'react'
  export const Footer: ComponentType | undefined
  export const OutlineFooter: ComponentType | undefined
  export const SidebarHeader: ComponentType | undefined
}
