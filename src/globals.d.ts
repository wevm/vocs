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

declare module 'virtual:react-router/server-build' {
  import type { ServerBuild } from 'react-router'
  const build: ServerBuild
  export = build
}

declare module 'virtual:vocs/config' {
  import type { Config } from './config.js'
  export const config: Config
}
