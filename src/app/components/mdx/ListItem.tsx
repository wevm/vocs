import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './ListItem.module.css'

export function ListItem(props: DetailedHTMLProps<HTMLAttributes<HTMLLIElement>, HTMLLIElement>) {
  return <li {...props} className={clsx(props.className, styles.root)} />
}
