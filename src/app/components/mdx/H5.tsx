import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './H5.css.js'
import { Heading } from './Heading.js'

export function H5(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
) {
  return <Heading {...props} className={clsx(props.className, styles.root)} level={5} />
}
