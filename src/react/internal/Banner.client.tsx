'use client'

import * as React from 'react'
import LucideArrowRight from '~icons/lucide/arrow-right'
import LucideX from '~icons/lucide/x'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'

const storageKeyPrefix = 'vocs-banner-dismissed'
const cssVar = '--vocs-spacing-banner'

function hashContent(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash.toString(36)
}

export function Banner() {
  const { banner: bannerConfig } = useConfig()
  const [dismissed, setDismissed] = React.useState<boolean | null>(null)
  const bannerRef = React.useRef<HTMLDivElement>(null)

  const banner = React.useMemo(() => {
    if (!bannerConfig) return null
    if (typeof bannerConfig === 'string') return { content: bannerConfig }
    return bannerConfig
  }, [bannerConfig])

  const storageKey = React.useMemo(() => {
    if (!banner) return storageKeyPrefix
    if (banner.dismissId) return `${storageKeyPrefix}-${banner.dismissId}`
    return `${storageKeyPrefix}-${hashContent(banner.content)}`
  }, [banner])

  React.useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === 'true')
  }, [storageKey])

  React.useEffect(() => {
    if (dismissed || !banner) {
      document.documentElement.style.removeProperty(cssVar)
      return
    }

    function updateHeight() {
      if (!bannerRef.current) return
      const height = bannerRef.current.offsetHeight
      document.documentElement.style.setProperty(cssVar, `${height}px`)
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
      document.documentElement.style.removeProperty(cssVar)
    }
  }, [dismissed, banner])

  if (!banner) return null
  if (dismissed === null) return null
  if (dismissed) return null

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    localStorage.setItem(storageKey, 'true')
    setDismissed(true)
  }

  const style: React.CSSProperties = {
    ...(banner.backgroundColor ? { backgroundColor: banner.backgroundColor } : {}),
    ...(banner.textColor ? { color: banner.textColor } : {}),
    ...(banner.height ? { height: banner.height } : {}),
  }

  const hasCustomColors = banner.backgroundColor || banner.textColor
  const variant = banner.variant ?? 'info'

  const inner = (
    <div
      ref={bannerRef}
      data-v-banner
      data-v-context={hasCustomColors ? undefined : variant}
      style={Object.keys(style).length > 0 ? style : undefined}
    >
      <div data-v-banner-content>
        <MarkdownContent content={banner.content} />
        {banner.href && <LucideArrowRight data-v-banner-arrow />}
      </div>
      {banner.dismissable !== false && (
        <button
          type="button"
          data-v-banner-dismiss
          onClick={handleDismiss}
          aria-label="Dismiss banner"
        >
          <LucideX />
        </button>
      )}
    </div>
  )

  if (banner.href) {
    const isExternal = banner.href.startsWith('http')
    return (
      <Link
        to={banner.href}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </Link>
    )
  }

  return inner
}

function MarkdownContent(props: { content: string }) {
  const { content } = props

  const parts: React.ReactNode[] = []
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0

  for (const match of content.matchAll(linkRegex)) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    const [full, text, href] = match
    const isExternal = href?.startsWith('http')
    parts.push(
      <Link
        key={match.index}
        to={href ?? ''}
        data-v-banner-link
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {text}
      </Link>,
    )

    lastIndex = match.index + full.length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return <>{parts}</>
}
