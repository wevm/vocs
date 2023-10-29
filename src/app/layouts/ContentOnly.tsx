import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import * as styles from './ContentOnly.css.js'

export function ContentOnly({ children, className }: { children: ReactNode; className: string }) {
  return <div className={clsx(className, styles.root)}>{children}</div>
}
