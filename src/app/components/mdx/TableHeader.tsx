import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './TableHeader.module.css'

export function TableHeader(
  props: DetailedHTMLProps<HTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>,
) {
  return <td {...props} className={clsx(props.className, styles.root)} />
}
