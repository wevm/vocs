import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './TableHeader.css.js'

export function TableHeader(
  props: DetailedHTMLProps<HTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>,
) {
  return <th {...props} className={clsx(props.className, styles.root)} />
}
