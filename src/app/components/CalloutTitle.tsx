import { type ClassValue, clsx } from 'clsx'

import * as styles from './CalloutTitle.css.js'

export type CalloutTitleProps = {
  className: ClassValue
  children: string
}

export function CalloutTitle({ className, children }: CalloutTitleProps) {
  return <strong className={clsx(className, styles.root)}>{children}</strong>
}
