import * as Dialog from '@radix-ui/react-dialog'
import { type ReactNode, useState } from 'react'

import { Content } from '../components/Content.js'
import { Sidebar } from '../components/Sidebar.js'
import { SidebarDrawer } from '../components/SidebarDrawer.js'
import { LowerTopNav, UpperTopNav } from '../components/TopNav.js'
import { Outline } from './Outline.js'
import * as styles from './PageLayout.css.js'

export function PageLayout({
  children,
}: {
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <SidebarDrawer.Root open={open} onOpenChange={setOpen}>
      <div className={styles.root}>
        <div className={styles.gutterLeft}>
          <Sidebar />
        </div>
        <div className={styles.gutterTopUpper}>
          <UpperTopNav />
        </div>
        <div className={styles.gutterTopLower}>
          <LowerTopNav MenuTrigger={Dialog.Trigger} />
        </div>
        <div className={styles.content}>
          <Content>{children}</Content>
        </div>
        <div className={styles.gutterRight}>
          <Outline />
        </div>
      </div>
      <SidebarDrawer>
        <Sidebar onClickSidebarItem={() => setOpen(false)} />
      </SidebarDrawer>
    </SidebarDrawer.Root>
  )
}
