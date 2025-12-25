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

declare module 'virtual:vocs/mdx-components' {
  import type { MDXComponents } from 'mdx/types.js'
  export const components: MDXComponents
}
