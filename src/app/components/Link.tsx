import { clsx } from 'clsx'
import { forwardRef } from 'react'
import { Link as RRLink, type LinkProps as RRLinkProps } from 'react-router-dom'

import { ExternalLink } from './ExternalLink.js'
import * as styles from './Link.css.js'

type LinkProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
  variant?: 'accent underlined' | 'styleless'
}

export const Link = forwardRef((props: LinkProps, ref) => {
  const { href, variant = 'accent underlined' } = props

  // External links
  if (href?.match(/^www|https?/))
    return (
      <ExternalLink
        {...props}
        ref={ref}
        className={clsx(
          props.className,
          styles.root,
          variant === 'accent underlined' && styles.accent_underlined,
          variant === 'styleless' && styles.styleless,
        )}
      />
    )

  // Internal links
  const [before, after] = (href || '').split('#')
  const to = `${before ? `${before}${before !== '/' ? '.html' : ''}` : ''}${
    after ? `#${after}` : ''
  }`
  return (
    <RRLink
      {...(props as RRLinkProps)}
      ref={ref as any}
      className={clsx(
        props.className,
        styles.root,
        variant === 'accent underlined' && styles.accent_underlined,
        variant === 'styleless' && styles.styleless,
      )}
      to={to}
    />
  )
})
