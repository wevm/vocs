import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './Figure.css.js'

export function Figure(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  const className = clsx(props.className, styles.root)

  return <figure {...props} className={className} />
}
