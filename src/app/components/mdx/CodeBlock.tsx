import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './CodeBlock.css.js'

export function CodeBlock(
  props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
) {
  return <div {...props} className={clsx(props.className, styles.root)} />
}
