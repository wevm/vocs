import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './H4.css.js'
import { Heading } from './Heading.js'

export function H4(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
) {
  return <Heading {...props} className={clsx(props.className, styles.root)} level={4} />
}
