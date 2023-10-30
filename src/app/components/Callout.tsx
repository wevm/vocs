import { type ClassValue, clsx } from 'clsx'
import { type ReactNode } from 'react'

import * as styles from './Callout.css.js'

export type CalloutProps = {
  className: ClassValue
  children: ReactNode
  type: 'note' | 'info' | 'warning' | 'danger' | 'tip' | 'success'
}

export function Callout({ className, children, type }: CalloutProps) {
  return <aside className={clsx(className, styles.root, styles[type])}>{children}</aside>
}
