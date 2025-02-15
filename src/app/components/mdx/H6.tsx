import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './H6.css.js'
import { Heading } from './Heading.js'

export function H6(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
) {
  return <Heading {...props} className={clsx(props.className, styles.root)} level={6} />
}
