import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './H2.css.js'
import { Heading } from './Heading.js'

export function H2(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
) {
  return <Heading {...props} className={clsx(props.className, styles.root)} level={2} />
}
