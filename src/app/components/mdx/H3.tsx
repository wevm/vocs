import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './H3.module.css'

export function H3(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
) {
  return <h3 {...props} className={clsx(props.className, styles.root)} />
}
