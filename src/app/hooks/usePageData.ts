import { createContext, useContext } from 'react'

import { type Module } from '../types.js'

export function usePageData() {
  const pageData = useContext(PageDataContext)
  if (!pageData) throw new Error('`usePageData` must be used within `PageDataContext.Provider`.')
  return pageData
}

export const PageDataContext = createContext<
  | {
      filePath?: string
      frontmatter: Module['frontmatter']
      lastUpdatedAt?: number
      previousPath?: string
    }
  | undefined
>(undefined)
