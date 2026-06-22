'use client'

import * as MdxPageContext from './MdxPageContext.js'
import { useSidebar } from './useSidebar.js'

export type LayoutState = {
  layout: 'full' | 'minimal' | 'blank'
  /** Content width: `default` (centered, readable) or `full` (full-bleed). */
  contentWidth: 'default' | 'full'
  showAskAi: boolean
  showLogo: boolean
  showOutline: boolean
  showSearch: boolean
  showSidebar: boolean
  showTopNav: boolean
  /** Outline depth (number of heading levels to show). `undefined` means show all. */
  outlineDepth: number | undefined
}

export function useLayout(): LayoutState {
  const { frontmatter } = MdxPageContext.use()
  const sidebar = useSidebar()

  const layout = frontmatter?.layout ?? 'full'
  const outline = frontmatter?.outline
  const contentWidth = frontmatter?.content?.width ?? 'default'

  return {
    layout,
    contentWidth,
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
    get showAskAi() {
      if (frontmatter?.showAskAi !== undefined) return frontmatter.showAskAi
      if (layout === 'blank') return false
      return true
    },
    get showSearch() {
      if (frontmatter?.showSearch !== undefined) return frontmatter.showSearch
      if (layout === 'blank') return false
      return true
    },
    get showLogo() {
      if (frontmatter?.showLogo !== undefined) return frontmatter.showLogo
      return true
    },
    get showOutline() {
      if (outline === false) return false
      if (outline !== undefined) return true
      if (layout === 'blank') return false
      if (layout === 'minimal') return false
      return true
    },
    get outlineDepth() {
      if (typeof outline === 'number') return outline
      return undefined
    },
  }
}
