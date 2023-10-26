import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './TableRow.module.css'

export function TableRow(
  props: DetailedHTMLProps<HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>,
) {
  return <tr {...props} className={clsx(props.className, styles.root)} />
}
