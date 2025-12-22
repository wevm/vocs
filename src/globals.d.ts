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
  import type { Config } from './config.js'
  export const config: Config
}

declare module 'virtual:vocs/pages' {
  export const pages: Record<string, () => Promise<unknown>>
}

declare module 'virtual:vocs/pages?contentType=md' {
  export const pages: Record<string, () => Promise<unknown>>
}
