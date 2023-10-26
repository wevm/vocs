import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './H5.module.css'

export function H5(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
) {
  return <h5 {...props} className={clsx(props.className, styles.root)} />
}
