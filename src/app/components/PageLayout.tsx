import { type ReactNode, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import { Content } from '../components/Content.js'
import { Sidebar } from '../components/Sidebar.js'
import { SidebarDrawer } from '../components/SidebarDrawer.js'
import { LowerTopNav, UpperTopNav } from '../components/TopNav.js'
import { Outline } from './Outline.js'
import * as styles from './PageLayout.css.js'
import { Popover } from './Popover.js'

export function PageLayout({
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
      <div ref={ref} className={styles.gutterTopUpper}>
        <UpperTopNav />
      </div>
      <div className={styles.gutterTopLower}>
        <SidebarDrawer.Root open={isSidebarOpen} onOpenChange={setSidebarOpen}>
          <Popover.Root open={isOutlineOpen} onOpenChange={setOutlineOpen}>
            <LowerTopNav
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
      </div>
      <div data-bottom-observer />
      <div className={styles.gutterRight}>
        <Outline />
      </div>
    </div>
  )
}
