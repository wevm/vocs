import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './Strong.css.js'

export function Strong(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return <strong {...props} className={clsx(props.className, styles.root)} />
}
