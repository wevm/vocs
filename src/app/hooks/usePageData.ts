import { createContext, useContext } from 'react'

import type { Module } from '../types.js'

export type PageData = {
  content?: string
  filePath?: string
  frontmatter: Module['frontmatter']
  lastUpdatedAt?: number
  previousPath?: string
}

export function usePageData() {
  const pageData = useContext(PageDataContext)
  if (!pageData) throw new Error('`usePageData` must be used within `PageDataContext.Provider`.')
  return pageData
}

export const PageDataContext = createContext<PageData | undefined>(undefined)
