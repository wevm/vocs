import { clsx } from 'clsx'
import { type AnchorHTMLAttributes, type DetailedHTMLProps } from 'react'

import { useLocation } from 'react-router-dom'
import * as styles from './Autolink.css.js'

export function Autolink(
  props: DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
) {
  const { pathname } = useLocation()
  return (
    <a
      {...props}
      className={clsx(props.className, styles.root)}
      href={`${pathname}${props.href}`}
    />
  )
}
