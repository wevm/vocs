import { clsx } from 'clsx'
import { forwardRef, useCallback, useMemo } from 'react'

import { useLocation } from 'react-router'
import { useConfig } from '../hooks/useConfig.js'
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

  const { viewTransition } = useConfig()

  const enableViewTransition = useMemo(() => {
    if (!viewTransition || !viewTransition.enabled) return false

    if (viewTransition.options?.pages === 'all') return true
    if (Array.isArray(viewTransition.options?.pages))
      return viewTransition.options.pages.includes(pathname)
    if (viewTransition.options?.pages === 'docs') return pathname.startsWith('/docs')

    return viewTransition.enabled
  }, [pathname, viewTransition])

  const setTransitionDuration = useCallback(
    (duration = viewTransition?.options?.duration || 300) => {
      if (!viewTransition?.enabled) return
      document.documentElement.style.setProperty('--view-transition-duration', `${duration}ms`)
    },
    [viewTransition?.enabled, viewTransition?.options?.duration],
  )

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
      onClick={() => setTransitionDuration(viewTransition?.options?.duration || 300)}
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
