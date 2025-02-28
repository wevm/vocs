import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './Header.css.js'

export function Header(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return <header {...props} className={clsx(props.className, styles.root)} />
}
