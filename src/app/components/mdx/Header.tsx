import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './Header.module.css'

export function Header(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return <header {...props} className={clsx(props.className, styles.root)} />
}
