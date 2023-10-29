import * as Dialog from '@radix-ui/react-dialog'
import { clsx } from 'clsx'
import { type ReactNode, useState } from 'react'

import { Sidebar } from '../components/Sidebar.js'
import { SidebarDrawer } from '../components/SidebarDrawer.js'
import { LowerTopNav, UpperTopNav } from '../components/TopNav.js'
import styles from './WithSidebar.module.css'

export function WithSidebar({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <SidebarDrawer.Root open={open} onOpenChange={setOpen}>
      <div className={clsx(className, styles.root)}>
        <div className={styles.gutterLeft}>
          <Sidebar />
        </div>
        <div className={styles.gutterTopUpper}>
          <UpperTopNav />
        </div>
        <div className={styles.gutterTopLower}>
          <LowerTopNav MenuTrigger={Dialog.Trigger} />
        </div>
        <div className={styles.content}>{children}</div>
      </div>
      <SidebarDrawer>
        <Sidebar onClickSidebarItem={() => setOpen(false)} />
      </SidebarDrawer>
    </SidebarDrawer.Root>
  )
}
