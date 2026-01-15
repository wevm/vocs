'use client'

import * as MdxPageContext from './MdxPageContext.js'
import { useSidebar } from './useSidebar.js'

export type LayoutState = {
  layout: 'full' | 'minimal' | 'blank'
  showSidebar: boolean
  showTopNav: boolean
  showOutline: boolean
  /** Outline depth (number of heading levels to show). `undefined` means show all. */
  outlineDepth: number | undefined
}

export function useLayout(): LayoutState {
  const { frontmatter } = MdxPageContext.use()
  const sidebar = useSidebar()

  const layout = frontmatter?.layout ?? 'full'
  const outline = frontmatter?.outline

  return {
    layout,
    get showSidebar() {
      if (frontmatter?.showSidebar !== undefined) return frontmatter.showSidebar
      if (sidebar.items.length === 0) return false
      if (layout === 'minimal') return false
      if (layout === 'blank') return false
      return true
    },
    get showTopNav() {
      if (frontmatter?.showTopNav !== undefined) return frontmatter.showTopNav
      if (layout === 'blank') return false
      return true
    },
    get showOutline() {
      if (outline === false) return false
      if (outline !== undefined) return true
      if (layout === 'blank') return false
      return true
    },
    get outlineDepth() {
      if (typeof outline === 'number') return outline
      return undefined
    },
  }
}
