import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './H6.module.css'

export function H6(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
) {
  return <h6 {...props} className={clsx(props.className, styles.root)} />
}
