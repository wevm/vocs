import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './Figcaption.css.js'

export function Figcaption(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  const className = clsx(props.className, styles.root)

  return <figcaption {...props} className={className} />
}
