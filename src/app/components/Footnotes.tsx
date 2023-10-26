import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './Footnotes.module.css'

export function Footnotes(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return <section {...props} className={clsx(props.className, styles.root)} />
}
