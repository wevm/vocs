import * as Popover_ from '@radix-ui/react-popover'
import type { ReactNode } from 'react'

import clsx from 'clsx'
import * as styles from './Popover.css.js'

Popover.Root = Popover_.Root
Popover.Trigger = Popover_.Trigger

export function Popover({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Popover_.Portal>
      <Popover_.Content className={clsx(styles.root, className)} sideOffset={12}>
        {children}
      </Popover_.Content>
    </Popover_.Portal>
  )
}
