import clsx from 'clsx'
import type { ReactNode } from 'react'

import * as styles from './Button.css.js'
import { Link } from './Link.js'

export type ButtonProps = {
  children: ReactNode
  className?: string
  href?: string
  variant?: 'accent'
}

export function Button({ children, className, href, variant }: ButtonProps) {
  return (
    <Link
      className={clsx(className, styles.button, variant === 'accent' && styles.button_accent)}
      href={href}
      variant="styleless"
    >
      {children}
    </Link>
  )
}
