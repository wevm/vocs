import { clsx } from 'clsx'

import { Link } from '../Link.js'
import * as styles from './Anchor.css.js'
import { Autolink } from './Autolink.js'

export function Anchor(
  props: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
) {
  const { children, href } = props

  // Heading slug links
  if (children && typeof children === 'object' && 'props' in children)
    return <Autolink className={clsx(props.className, styles.root)} {...props} />

  // ID links
  if (href?.match(/^#/)) return <a className={clsx(props.className, styles.root)} {...props} />

  return <Link className={clsx(props.className, styles.root)} {...props} />
}
