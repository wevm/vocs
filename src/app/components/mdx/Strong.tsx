import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './Strong.module.css'

export function Strong(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return <strong {...props} className={clsx(props.className, styles.root)} />
}
