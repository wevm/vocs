import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

import { Content } from '../components/Content.js'
import { DesktopTopNav } from '../components/DesktopTopNav.js'
import { Footer } from '../components/Footer.js'
import { MobileTopNav } from '../components/MobileTopNav.js'
import { Outline } from '../components/Outline.js'
import { Sidebar } from '../components/Sidebar.js'
import { SkipLink, skipLinkId } from '../components/SkipLink.js'
import { useConfig } from '../hooks/useConfig.js'
import { usePageData } from '../hooks/usePageData.js'
import * as styles from './DocsLayout.css.js'

export function DocsLayout({
  children,
}: {
  children: ReactNode
}) {
  const config = useConfig()
  const { sidebar } = config

  const { frontmatter } = usePageData()

  const showOutline = (() => {
    if (frontmatter) {
      if ('outline' in frontmatter) return frontmatter.outline
      if (frontmatter.layout === 'blog') return false
    }
    return true
  })()
  const showSidebar = (() => {
    if (frontmatter) {
      if ('sidebar' in frontmatter) return frontmatter.sidebar
      if (frontmatter.layout === 'blog') return false
    }
    return Boolean(sidebar)
  })()

  const { ref, inView } = useInView({
    initialInView: true,
    rootMargin: '100px 0px 0px 0px',
  })

  return (
    <div className={styles.root}>
      <SkipLink />
      {showSidebar && (
        <div className={styles.gutterLeft}>
          <Sidebar className={styles.sidebar} />
        </div>
      )}
      <div
        ref={ref}
        className={clsx(styles.gutterTop, showSidebar && styles.gutterTop_withSidebar)}
      >
        <DesktopTopNav />
        <MobileTopNav />
      </div>
      <div
        className={clsx(
          styles.gutterTopCurtain,
          showSidebar && styles.gutterTopCurtain_withSidebar,
          frontmatter?.layout === 'blog' && styles.gutterTopCurtain_blog,
        )}
      >
        <DesktopTopNav.Curtain />
        <MobileTopNav.Curtain enableScrollToTop={!inView} />
      </div>
      <div
        id={skipLinkId}
        className={clsx(styles.content, showSidebar && styles.content_withSidebar)}
      >
        <Content>{children}</Content>
        <Footer />
      </div>
      <div data-bottom-observer />
      {showOutline && (
        <div className={clsx(styles.gutterRight, showSidebar && styles.gutterRight_withSidebar)}>
          <Outline />
        </div>
      )}
    </div>
  )
}
