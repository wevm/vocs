import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

import * as styles from './SidebarDrawer.css.js'

SidebarDrawer.Root = Dialog.Root
SidebarDrawer.Trigger = Dialog.Trigger

export function SidebarDrawer({
  children,
  className,
}: { children: ReactNode; className?: string }) {
  return (
    <Dialog.Portal>
      <div className={className}>
        <Dialog.Overlay className={styles.backdrop} />
        <Dialog.Content className={styles.root}>{children}</Dialog.Content>
      </div>
    </Dialog.Portal>
  )
}
