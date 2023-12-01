import { clsx } from 'clsx'
import { forwardRef } from 'react'

import { useLocation } from 'react-router-dom'
import { ExternalLink } from './ExternalLink.js'
import * as styles from './Link.css.js'
import { RouterLink, type RouterLinkProps } from './RouterLink.js'

type LinkProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
  variant?: 'accent underlined' | 'styleless'
}

export const Link = forwardRef((props: LinkProps, ref) => {
  const { href, variant = 'accent underlined' } = props

  const { pathname } = useLocation()

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
  const to = `${before ? before : pathname}${after ? `#${after}` : ''}`
  return (
    <RouterLink
      {...(props as RouterLinkProps)}
      ref={ref}
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
