import { clsx } from 'clsx'
import { forwardRef, useMemo } from 'react'

import { useLocation } from 'react-router'
import { ExternalLink } from './ExternalLink.js'
import * as styles from './Link.css.js'
import { RouterLink, type RouterLinkProps } from './RouterLink.js'

type LinkProps = {
  children: React.ReactNode
  className?: string
  hideExternalIcon?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  href?: string
  variant?: 'accent' | 'styleless'
}

export const Link = forwardRef((props: LinkProps, ref) => {
  const { hideExternalIcon, href, variant = 'accent' } = props

  const { pathname } = useLocation()

  const enableViewTransition = useMemo(() => {
    const config = Object.hasOwn(__VOCSDOC_VIEW_TRANSITION__, 'enabled')
      ? __VOCSDOC_VIEW_TRANSITION__
      : { enabled: false }

    if (!config.enabled) return false
    if (config.options?.pages === 'all') return true
    if (Array.isArray(config.options?.pages)) return config.options.pages.includes(pathname)
    if (config.options?.pages === 'docs') return pathname.startsWith('/docs')

    return config.enabled
  }, [pathname])

  // External links
  if (href?.match(/^(www|https?)/))
    return (
      <ExternalLink
        {...props}
        ref={ref}
        className={clsx(
          props.className,
          styles.root,
          variant === 'accent' && styles.accent,
          variant === 'styleless' && styles.styleless,
        )}
        hideExternalIcon={hideExternalIcon}
      />
    )

  // Internal links
  const [before, after] = (href || '').split('#')
  const to = `${before ? before : pathname}${after ? `#${after}` : ''}`

  return (
    <RouterLink
      {...(props as RouterLinkProps)}
      viewTransition={enableViewTransition}
      ref={ref}
      className={clsx(
        props.className,
        styles.root,
        variant === 'accent' && styles.accent,
        variant === 'styleless' && styles.styleless,
      )}
      to={to}
    />
  )
})
