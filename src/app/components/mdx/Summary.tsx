import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './Summary.css.js'

export function Summary(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return <summary {...props} className={clsx(props.className, styles.root)} />
}
