import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './H1.css.js'

export function H1(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
) {
  return <h1 {...props} className={clsx(props.className, styles.root)} />
}
