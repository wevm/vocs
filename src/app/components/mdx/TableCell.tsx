import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './TableCell.css.js'

export function TableCell(
  props: DetailedHTMLProps<HTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>,
) {
  return <td {...props} className={clsx(props.className, styles.root)} />
}
