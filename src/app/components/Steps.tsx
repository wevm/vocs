import { type ClassValue, clsx } from 'clsx'
import type { ReactNode } from 'react'

import * as styles from './Steps.css.js'

export type StepsProps = {
  children: ReactNode
  className?: ClassValue
}

export function Steps({ children, className }: StepsProps) {
  return <div className={clsx(className, styles.root)}>{children}</div>
}
