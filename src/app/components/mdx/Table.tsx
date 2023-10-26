import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './Table.module.css'

export function Table(
  props: DetailedHTMLProps<HTMLAttributes<HTMLTableElement>, HTMLTableElement>,
) {
  return <table {...props} className={clsx(props.className, styles.root)} />
}
