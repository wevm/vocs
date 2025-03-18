import type { Layout } from '../types.js'
import { useConfig } from './useConfig.js'
import { usePageData } from './usePageData.js'
import { useSidebar } from './useSidebar.js'

export function useLayout(): Layout {
  const { aiCta } = useConfig()
  const sidebar = useSidebar()
  const { frontmatter } = usePageData()
  const {
    layout: layout_,
    showLogo,
    showAiCta,
    showOutline,
    showSidebar,
    showTopNav,
  } = frontmatter || {}

  const layout = layout_ ?? 'docs'

  return {
    layout,
    get showLogo() {
      if (typeof showLogo !== 'undefined') return showLogo
      return true
    },
    get showAiCta() {
      if (typeof showAiCta !== 'undefined') return showAiCta
      if (aiCta === false) return false
      return layout === 'docs'
    },
    get showOutline() {
      if (typeof showOutline !== 'undefined') return showOutline
      return layout === 'docs'
    },
    get showSidebar() {
      if (sidebar.items.length === 0) return false
      if (typeof showSidebar !== 'undefined') return showSidebar
      if (layout === 'minimal') return false
      if (layout === 'landing') return false
      return true
    },
    get showTopNav() {
      if (typeof showTopNav !== 'undefined') return showTopNav
      return true
    },
  }
}
