'use client'

import * as React from 'react'
import LucideArrowRight from '~icons/lucide/arrow-right'
import LucideX from '~icons/lucide/x'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'

const storageKey = 'vocs-banner-dismissed'
const cssVar = '--vocs-spacing-banner'

export function Banner() {
  const { banner } = useConfig()
  const [dismissed, setDismissed] = React.useState<boolean | null>(null)
  const bannerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === 'true')
  }, [])

  React.useEffect(() => {
    if (dismissed || !banner || typeof banner === 'string') {
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
  if (typeof banner === 'string') return null
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

  const inner = (
    <div
      ref={bannerRef}
      data-v-banner
      data-v-context={hasCustomColors ? undefined : banner.variant}
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
    const isExternal = href.startsWith('http')
    parts.push(
      <Link
        key={match.index}
        to={href}
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
