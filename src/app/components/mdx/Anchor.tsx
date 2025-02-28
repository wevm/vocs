import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'

import { Link } from '../Link.js'
import * as styles from './Anchor.css.js'
import { Autolink } from './Autolink.js'

type AnchorProps = {
  children: ReactNode
  className?: string
  href?: string
}

export function Anchor(props: AnchorProps) {
  const { children, href } = props
  const { pathname } = useLocation()

  // Heading slug links
  if (
    children &&
    typeof children === 'object' &&
    'props' in children &&
    (children.props as { 'data-autolink-icon'?: boolean })['data-autolink-icon']
  )
    return <Autolink className={clsx(props.className, styles.root)} {...props} />

  // ID links
  if (href?.match(/^#/))
    return (
      <a className={clsx(props.className, styles.root)} {...props} href={`${pathname}${href}`} />
    )

  return <Link className={clsx(props.className, styles.root)} {...props} />
}
