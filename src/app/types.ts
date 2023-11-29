import type { MDXComponents } from 'mdx/types.js'
import * as React from 'react'

export type BlogPost = {
  authors?: string | string[]
  date?: string
  path: string
  title: string
  description: string
}

export type Frontmatter = {
  [key: string]: unknown
  authors?: string | string[]
  date?: string
  description?: string
  layout?: 'minimal'
  logo?: boolean
  outline?: number | boolean
  sidebar?: boolean
  title?: string
}

export type Module = {
  default: React.ComponentType<{ components: MDXComponents }>
  frontmatter?: Frontmatter
}

export type PageData = {
  filePath: string
  frontmatter?: Frontmatter
}

export type Route = {
  filePath: string
  lazy: () => Promise<Module>
  path: string
  type: 'jsx' | 'mdx'
}
