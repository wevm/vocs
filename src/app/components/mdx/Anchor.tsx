import { clsx } from 'clsx'
import { Link, type LinkProps } from 'react-router-dom'

import styles from './Anchor.module.css'

export function Anchor(
  props: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
) {
  const { href } = props
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
