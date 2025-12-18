import type { Frontmatter } from './types.ts'

// biome-ignore lint/complexity/noUselessEmptyExport: _
export {}

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const Component: ComponentType
  export default Component
  export const frontmatter: Frontmatter
}

declare module '*.md' {
  import type { ComponentType } from 'react'
  const Component: ComponentType
  export default Component
  export const frontmatter: Frontmatter
}
