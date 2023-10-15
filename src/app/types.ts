import * as React from 'react'

export type Frontmatter = {
  [key: string]: unknown
  title?: string
}

export type Module = {
  default: React.ComponentType
  frontmatter?: Frontmatter
  head?: React.ReactNode
}

export type Page = {
  modulePath: string
  lazy: () => Promise<Module>
  path: string
  type: 'mdx' | 'jsx'
}
