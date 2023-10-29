import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './Code.css.js'

export function Code(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return <code {...props} className={clsx(props.className, styles.root)} />
}
