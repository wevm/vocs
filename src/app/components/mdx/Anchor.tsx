import { clsx } from 'clsx'
import { Link, type LinkProps } from 'react-router-dom'

import * as styles from './Anchor.css.js'
import { Autolink } from './Autolink.js'

export function Anchor(
  props: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
) {
  const { href } = props

  const children = props.children
  if (children && typeof children === 'object' && 'props' in children)
    return <Autolink className={clsx(props.className, styles.root)} {...props} />

  if (href?.match(/^#/)) return <a className={clsx(props.className, styles.root)} {...props} />
  if (href?.match(/^www|https?/))
    return (
      <a
        className={clsx(props.className, styles.root)}
        {...props}
        target="_blank"
        rel="noopener noreferrer"
      />
    )
  const [before, after] = href!.split('#')
  const to = `${before ? `${before}${before !== '/' ? '.html' : ''}` : ''}${
    after ? `#${after}` : ''
  }`
  return <Link {...(props as LinkProps)} className={clsx(props.className, styles.root)} to={to} />
}
