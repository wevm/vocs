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
  head?: React.ReactNode
}

export type Route = {
  modulePath: string
  lazy: () => Promise<Module>
  path: string
  type: 'mdx' | 'jsx'
}
