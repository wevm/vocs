import { clsx } from 'clsx'
import { Link, type LinkProps } from 'react-router-dom'

import { ExternalLink } from '../ExternalLink.js'
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

  // External links
  if (href?.match(/^www|https?/))
    return <ExternalLink className={clsx(props.className, styles.root)} {...props} />

  // Internal links
  const [before, after] = href!.split('#')
  const to = `${before ? `${before}${before !== '/' ? '.html' : ''}` : ''}${
    after ? `#${after}` : ''
  }`
  return <Link {...(props as LinkProps)} className={clsx(props.className, styles.root)} to={to} />
}
