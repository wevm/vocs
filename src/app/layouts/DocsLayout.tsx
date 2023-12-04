import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

import { assignInlineVars } from '@vanilla-extract/dynamic'
import { Content } from '../components/Content.js'
import { DesktopTopNav } from '../components/DesktopTopNav.js'
import { Footer } from '../components/Footer.js'
import { MobileTopNav } from '../components/MobileTopNav.js'
import { Outline } from '../components/Outline.js'
import { Sidebar } from '../components/Sidebar.js'
import { SkipLink, skipLinkId } from '../components/SkipLink.js'
import { usePageData } from '../hooks/usePageData.js'
import { useSidebar } from '../hooks/useSidebar.js'
import { contentVars } from '../styles/vars.css.js'
import * as styles from './DocsLayout.css.js'

export function DocsLayout({
  children,
}: {
  children: ReactNode
}) {
  const sidebar = useSidebar()

  const { frontmatter = {} } = usePageData()

  const { content } = frontmatter

  const showOutline = (() => {
    if (frontmatter) {
      if ('outline' in frontmatter) return frontmatter.outline
      if (frontmatter.layout === 'minimal') return false
    }
    return true
  })()
  const showSidebar = (() => {
    if (frontmatter) {
      if ('sidebar' in frontmatter) return frontmatter.sidebar
      if (frontmatter.layout === 'minimal') return false
    }
    return sidebar.length > 0
  })()
  const showTopNav = (() => {
    if ('topNav' in frontmatter) return frontmatter.topNav
    return true
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

      {showTopNav && (
        <>
          <div
            ref={ref}
            className={clsx(
              styles.gutterTop,
              (frontmatter?.logo || !('logo' in frontmatter)) && styles.gutterTop_offsetLeftGutter,
            )}
          >
            <DesktopTopNav />
            <MobileTopNav />
          </div>

          <div
            className={clsx(
              styles.gutterTopCurtain,
              showSidebar && styles.gutterTopCurtain_withSidebar,
              frontmatter?.layout === 'minimal' && styles.gutterTopCurtain_blog,
            )}
          >
            <DesktopTopNav.Curtain />
            <MobileTopNav.Curtain enableScrollToTop={!inView} />
          </div>
        </>
      )}

      {showOutline && (
        <div className={clsx(styles.gutterRight, showSidebar && styles.gutterRight_withSidebar)}>
          <Outline />
        </div>
      )}

      <div
        id={skipLinkId}
        className={clsx(
          styles.content,
          showSidebar && styles.content_withSidebar,
          showTopNav && styles.content_withTopNav,
        )}
        style={assignInlineVars({
          [contentVars.horizontalPadding]: content?.horizontalPadding,
          [contentVars.width]: content?.width,
          [contentVars.verticalPadding]: content?.verticalPadding,
        })}
      >
        <Content>{children}</Content>
        <Footer />
      </div>
      <div data-bottom-observer />
    </div>
  )
}
