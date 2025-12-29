/// <reference types="unplugin-icons/types/react" />

declare module '*.mdx' {
  import type { Frontmatter } from './types.ts'
  export default function MDXContent(props: Record<string, unknown>): JSX.Element
  export const frontmatter: Frontmatter
}

declare module '*.md' {
  import type { Frontmatter } from './types.ts'
  export default function MDXContent(props: Record<string, unknown>): JSX.Element
  export const frontmatter: Frontmatter
}

declare module 'virtual:vocs/config' {
  export const config: import('./config.js').Config
}

declare module 'virtual:vocs/mdx-components' {
  export const components: import('mdx/types.js').MDXComponents
}
