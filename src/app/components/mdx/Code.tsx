import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './Code.module.css'

export function Code(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return <code {...props} className={clsx(props.className, styles.root)} />
}
