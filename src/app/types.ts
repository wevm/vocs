import type { MDXComponents } from 'mdx/types.js'
import * as React from 'react'

export type Frontmatter = {
  [key: string]: unknown
  description?: string
  title?: string
}

export type Module = {
  default: React.ComponentType<{ components: MDXComponents }>
  frontmatter?: Frontmatter
}

export type Route = {
  lazy: () => Promise<Module>
  path: string
  type: 'mdx' | 'jsx'
}
