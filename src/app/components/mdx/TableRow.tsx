import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './TableRow.css.js'

export function TableRow(
  props: DetailedHTMLProps<HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>,
) {
  return <tr {...props} className={clsx(props.className, styles.root)} />
}
