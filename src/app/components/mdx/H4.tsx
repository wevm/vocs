import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './H4.module.css'

export function H4(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
) {
  return <h4 {...props} className={clsx(props.className, styles.root)} />
}
