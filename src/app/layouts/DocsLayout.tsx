import { type ReactNode, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import { Content } from '../components/Content.js'
import { DesktopTopNav } from '../components/DesktopTopNav.js'
import { Footer } from '../components/Footer.js'
import { MobileTopNav } from '../components/MobileTopNav.js'
import { Outline } from '../components/Outline.js'
import { Popover } from '../components/Popover.js'
import { Sidebar } from '../components/Sidebar.js'
import { SidebarDrawer } from '../components/SidebarDrawer.js'
import * as styles from './DocsLayout.css.js'

export function DocsLayout({
  children,
}: {
  children: ReactNode
}) {
  const [isOutlineOpen, setOutlineOpen] = useState(false)
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const { ref, inView } = useInView({
    initialInView: true,
    rootMargin: '100px 0px 0px 0px',
  })

  return (
    <div className={styles.root}>
      <div className={styles.gutterLeft}>
        <Sidebar />
      </div>
      <div ref={ref} className={styles.gutterTop}>
        <DesktopTopNav />
        <MobileTopNav />
      </div>
      <div className={styles.gutterTopCurtain}>
        <DesktopTopNav.Curtain />

        <SidebarDrawer.Root open={isSidebarOpen} onOpenChange={setSidebarOpen}>
          <Popover.Root open={isOutlineOpen} onOpenChange={setOutlineOpen}>
            <MobileTopNav.Curtain
              enableScrollToTop={!inView}
              MenuTrigger={SidebarDrawer.Trigger}
              OutlineTrigger={Popover.Trigger}
            />
            <SidebarDrawer className={styles.sidebarDrawer}>
              <Sidebar onClickItem={() => setSidebarOpen(false)} />
            </SidebarDrawer>
            <Popover className={styles.outlinePopover}>
              <Outline
                onClickItem={() => setOutlineOpen(false)}
                highlightActive={false}
                showTitle={false}
              />
            </Popover>
          </Popover.Root>
        </SidebarDrawer.Root>
      </div>
      <div className={styles.content}>
        <Content>{children}</Content>
        <Footer />
      </div>
      <div data-bottom-observer />
      <div className={styles.gutterRight}>
        <Outline />
      </div>
    </div>
  )
}
