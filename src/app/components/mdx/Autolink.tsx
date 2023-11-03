import { clsx } from 'clsx'
import { type AnchorHTMLAttributes, type DetailedHTMLProps } from 'react'

import * as styles from './Autolink.css.js'

export function Autolink(
  props: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
) {
  return <a {...props} className={clsx(props.className, styles.root)} />
}
