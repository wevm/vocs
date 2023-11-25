import type { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

import { Content } from '../components/Content.js'
import { DesktopTopNav } from '../components/DesktopTopNav.js'
import { MobileTopNav } from '../components/MobileTopNav.js'
import { Outline } from '../components/Outline.js'
import { Sidebar } from '../components/Sidebar.js'
import * as styles from './DocsLayout.css.js'

export function DocsLayout({
  children,
}: {
  children: ReactNode
}) {
  const { ref, inView } = useInView({
    initialInView: true,
    rootMargin: '100px 0px 0px 0px',
  })

  return (
    <div className={styles.root}>
      <div className={styles.gutterLeft}>
        <Sidebar className={styles.sidebar} />
      </div>
      <div ref={ref} className={styles.gutterTop}>
        <DesktopTopNav />
        <MobileTopNav />
      </div>
      <div className={styles.gutterTopCurtain}>
        <DesktopTopNav.Curtain />
        <MobileTopNav.Curtain enableScrollToTop={!inView} />
      </div>
      <div className={styles.content}>
        <Content>{children}</Content>
      </div>
      <div data-bottom-observer />
      <div className={styles.gutterRight}>
        <Outline />
      </div>
    </div>
  )
}
