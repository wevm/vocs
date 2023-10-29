import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './ContentOnly.module.css'

export function ContentOnly({ children, className }: { children: ReactNode; className: string }) {
  return <div className={clsx(className, styles.root)}>{children}</div>
}
