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
  content?: {
    horizontalPadding?: string
    width?: string
    verticalPadding?: string
  }
  date?: string
  description?: string
  title?: string
} & Partial<Layout>

export type Layout = {
  layout: 'docs' | 'landing' | 'minimal'
  showLogo: boolean
  showOutline: number | boolean
  showSidebar: boolean
  showTopNav: boolean
}

export type Module = {
  default: React.ComponentType
  frontmatter?: Frontmatter
}

export type PageData = {
  filePath: string
  frontmatter?: Frontmatter
}

export type Route = {
  filePath: string
  lazy: () => Promise<Module>
  lastUpdatedAt?: number
  path: string
  type: 'jsx' | 'mdx'
}
