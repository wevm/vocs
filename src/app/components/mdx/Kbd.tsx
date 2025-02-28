import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './Kbd.css.js'

export function Kbd(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  return <kbd {...props} className={clsx(props.className, styles.root)} />
}
