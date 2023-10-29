import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

import styles from './SidebarDrawer.module.css'

SidebarDrawer.Root = Dialog.Root

export function SidebarDrawer({ children }: { children: ReactNode }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className={styles.backdrop} />
      <Dialog.Content className={styles.drawer}>{children}</Dialog.Content>
    </Dialog.Portal>
  )
}
