import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './ListItem.css.js'

export function ListItem(props: DetailedHTMLProps<HTMLAttributes<HTMLLIElement>, HTMLLIElement>) {
  return <li {...props} className={clsx(props.className, styles.root)} />
}
