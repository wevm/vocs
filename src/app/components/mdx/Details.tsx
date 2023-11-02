import { clsx } from 'clsx'
import { type DetailedHTMLProps, type DetailsHTMLAttributes } from 'react'

import * as styles from './Details.css.js'

export function Details(
  props: DetailedHTMLProps<DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>,
) {
  return <details {...props} className={clsx(props.className, styles.root)} />
}
