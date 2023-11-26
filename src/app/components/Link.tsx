import { clsx } from 'clsx'
import { Link as RRLink, type LinkProps as RRLinkProps } from 'react-router-dom'

import { ExternalLink } from './ExternalLink.js'
import * as styles from './Link.css.js'

type LinkProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & {
  variant?: 'accent underlined' | 'styleless'
}

export function Link(props: LinkProps) {
  const { href, variant = 'accent underlined' } = props

  // External links
  if (href?.match(/^www|https?/))
    return (
      <ExternalLink
        className={clsx(
          props.className,
          styles.root,
          variant === 'accent underlined' && styles.accent_underlined,
        )}
        {...props}
      />
    )

  // Internal links
  const [before, after] = href!.split('#')
  const to = `${before ? `${before}${before !== '/' ? '.html' : ''}` : ''}${
    after ? `#${after}` : ''
  }`
  return (
    <RRLink
      {...(props as RRLinkProps)}
      className={clsx(
        props.className,
        styles.root,
        variant === 'accent underlined' && styles.accent_underlined,
      )}
      to={to}
    />
  )
}
