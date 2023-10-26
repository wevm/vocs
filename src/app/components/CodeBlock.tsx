import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './CodeBlock.module.css'

export function CodeBlock(
  props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
) {
  return <div {...props} className={clsx(props.className, styles.root)} />
}
