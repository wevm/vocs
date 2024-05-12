import { clsx } from 'clsx'
import { type AnchorHTMLAttributes, type DetailedHTMLProps } from 'react'
import { Link } from 'react-router-dom'

import * as styles from './Autolink.css.js'

export function Autolink(
  props: Omit<DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, 'ref'>,
) {
  if (!props.href) return null
  return <Link {...props} className={clsx(props.className, styles.root)} to={props.href} />
}
