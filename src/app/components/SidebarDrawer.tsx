import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

import * as styles from './SidebarDrawer.css.js'

SidebarDrawer.Root = Dialog.Root

export function SidebarDrawer({ children }: { children: ReactNode }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className={styles.backdrop} />
      <Dialog.Content className={styles.root}>{children}</Dialog.Content>
    </Dialog.Portal>
  )
}
