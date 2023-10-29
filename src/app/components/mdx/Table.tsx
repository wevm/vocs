import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './Table.css.js'

export function Table(
  props: DetailedHTMLProps<HTMLAttributes<HTMLTableElement>, HTMLTableElement>,
) {
  return <table {...props} className={clsx(props.className, styles.root)} />
}
