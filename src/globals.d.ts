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
