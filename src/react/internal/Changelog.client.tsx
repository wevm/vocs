'use client'

import { cx } from 'cva'
import * as React from 'react'
import { createPortal } from 'react-dom'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideExternalLink from '~icons/lucide/external-link'
import LucideHistory from '~icons/lucide/history'
import type * as ChangelogTypes from '../../internal/changelog.js'
import { Badge } from '../Badge.js'

const collapsedHeight = 600

export function Changelog(props: Changelog.Props): React.JSX.Element {
  const { className, releases } = props
  const [activeVersion, setActiveVersion] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (releases.length > 0 && releases[0]) {
      setActiveVersion(releases[0].version)
    }
  }, [releases])

  React.useEffect(() => {
    if (typeof window === 'undefined' || releases.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const version = entry.target.id
            if (version) setActiveVersion(version)
            break
          }
        }
      },
      { rootMargin: '0px 0px -80% 0px' },
    )

    for (const release of releases) {
      const element = document.getElementById(release.version)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [releases])

  if (releases.length === 0) {
    return <div className="vocs:text-secondary vocs:py-12 vocs:text-center">No releases found.</div>
  }

  return (
    <div className={cx('vocs:relative', className)} data-v-changelog>
      <div className="vocs:flex vocs:flex-col vocs:w-full">
        {releases.map((release, index) => (
          <Release key={release.version} release={release} isLast={index === releases.length - 1} />
        ))}
      </div>

      <VersionOutline releases={releases} activeVersion={activeVersion} />
    </div>
  )
}

export declare namespace Changelog {
  export type Props = {
    className?: string | undefined
    releases: ChangelogTypes.Release[]
  }
}

export function Skeleton(): React.JSX.Element {
  return (
    <div className="vocs:flex vocs:flex-col vocs:w-full vocs:animate-pulse" data-v-changelog>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="vocs:relative vocs:flex vocs:gap-8 vocs:md:gap-12 vocs:py-6 vocs:border-b vocs:border-primary"
        >
          {/* Left column skeleton */}
          <div className="vocs:hidden vocs:md:block vocs:w-36 vocs:shrink-0">
            <div className="vocs:flex vocs:flex-col vocs:gap-2">
              <div className="vocs:h-8 vocs:w-24 vocs:bg-surfaceTint vocs:rounded-md" />
              <div className="vocs:h-4 vocs:w-28 vocs:bg-surfaceTint vocs:rounded" />
            </div>
          </div>

          {/* Right column skeleton */}
          <div className="vocs:flex-1 vocs:min-w-0 vocs:space-y-4">
            {/* Mobile header skeleton */}
            <div className="vocs:md:hidden vocs:flex vocs:items-center vocs:gap-3">
              <div className="vocs:h-7 vocs:w-20 vocs:bg-surfaceTint vocs:rounded-md" />
              <div className="vocs:h-4 vocs:w-24 vocs:bg-surfaceTint vocs:rounded" />
            </div>

            {/* Content skeleton */}
            <div className="vocs:space-y-3">
              <div className="vocs:h-4 vocs:w-full vocs:bg-surfaceTint vocs:rounded" />
              <div className="vocs:h-4 vocs:w-5/6 vocs:bg-surfaceTint vocs:rounded" />
              <div className="vocs:h-4 vocs:w-4/6 vocs:bg-surfaceTint vocs:rounded" />
              <div className="vocs:h-4 vocs:w-3/4 vocs:bg-surfaceTint vocs:rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// biome-ignore lint/correctness/noUnusedVariables: _
function VersionOutline(props: VersionOutline.Props): React.JSX.Element | null {
  const { releases, activeVersion } = props
  const [mounted, setMounted] = React.useState(false)
  const [positions, setPositions] = React.useState<Map<string, { top: number; height: number }>>(
    new Map(),
  )
  const [container, setContainer] = React.useState<HTMLUListElement | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const containerRef = React.useCallback((node: HTMLUListElement | null) => {
    setContainer(node)
  }, [])

  React.useEffect(() => {
    if (!container) return

    const measurePositions = () => {
      const newPositions = new Map<string, { top: number; height: number }>()
      const listItems = container.querySelectorAll<HTMLLIElement>('[data-v-version-item]')

      for (const el of listItems) {
        const version = el.dataset['version']
        if (version) {
          newPositions.set(version, {
            top: el.offsetTop,
            height: el.offsetHeight,
          })
        }
      }

      setPositions(newPositions)
    }

    measurePositions()

    const observer = new ResizeObserver(measurePositions)
    observer.observe(container)
    return () => {
      observer.disconnect()
    }
  }, [container])

  const indicatorStyle = React.useMemo<React.CSSProperties>(() => {
    if (!activeVersion || positions.size === 0) {
      return { transform: 'translateY(0)', height: 24 }
    }

    const pos = positions.get(activeVersion)
    if (!pos) return { transform: 'translateY(0)', height: 24 }

    return {
      transform: `translateY(${pos.top}px)`,
      height: pos.height,
    }
  }, [activeVersion, positions])

  // Scroll the active version into view in the outline
  React.useEffect(() => {
    if (!activeVersion || !container) return

    const activeItem = container.querySelector(`[data-version="${activeVersion}"]`)
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeVersion, container])

  if (!mounted) return null

  const outline = (
    <nav
      className="vocs:hidden vocs:xl:block vocs:text-[13px] vocs:fixed vocs:right-[max(2rem,calc((100vw-1200px)/2))] vocs:top-24 vocs:w-48 vocs:z-50"
      style={{ maxHeight: 'calc(100vh - 8rem)' }}
      data-v-version-outline
    >
      <div className="vocs:flex vocs:items-center vocs:gap-1.5 vocs:text-[13px] vocs:font-medium vocs:mb-3">
        <LucideHistory className="vocs:size-3.5" />
        Versions
      </div>

      <ul
        ref={containerRef}
        className="vocs:relative vocs:flex vocs:flex-col vocs:border-l-2 vocs:border-primary vocs:overscroll-contain"
        style={{ maxHeight: 'calc(100vh - 12rem)', overflowY: 'auto', scrollbarWidth: 'thin' }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: -2,
            width: 2,
            borderRadius: 9999,
            backgroundColor: 'var(--vocs-color-accent)',
            transition: 'transform 150ms ease-out, height 150ms ease-out',
            zIndex: 10,
            ...indicatorStyle,
          }}
          data-v-version-indicator
        />

        {releases.map((release) => {
          const isActive = activeVersion === release.version
          return (
            <li
              key={release.version}
              data-v-version-item
              data-version={release.version}
              className="vocs:scroll-my-4"
            >
              <a
                href={`#${release.version}`}
                className={cx(
                  'vocs:block vocs:leading-snug vocs:py-1 vocs:pl-3 vocs:cursor-pointer vocs:font-mono vocs:text-xs vocs:transition-colors vocs:duration-100',
                  isActive ? 'vocs:text-accent' : 'vocs:text-secondary vocs:hover:text-link',
                )}
                data-active={isActive}
              >
                {release.version}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )

  return createPortal(outline, document.body)
}

declare namespace VersionOutline {
  type Props = {
    releases: ChangelogTypes.Release[]
    activeVersion: string | null
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function Release(props: Release.Props): React.JSX.Element {
  const { release, isLast = false } = props
  const [expanded, setExpanded] = React.useState(false)
  const [needsExpansion, setNeedsExpansion] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (contentRef.current) {
      setNeedsExpansion(contentRef.current.scrollHeight > collapsedHeight)
    }
  }, [])

  const formattedDate = React.useMemo(() => {
    const date = new Date(release.date)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [release.date])

  return (
    <article
      id={release.version}
      className="vocs:relative vocs:flex vocs:gap-8 vocs:md:gap-12 vocs:scroll-mt-20"
      data-v-changelog-release
    >
      {/* Left column - sticky version/date */}
      <div className="vocs:hidden vocs:md:block vocs:w-36 vocs:shrink-0">
        <div className="vocs:sticky vocs:top-20 vocs:flex vocs:flex-col vocs:gap-2 vocs:py-6">
          {/* Timeline dot */}
          <div className="vocs:absolute vocs:left-[calc(100%+1rem)] vocs:top-8 vocs:w-2.5 vocs:h-2.5 vocs:rounded-full vocs:bg-secondary vocs:z-10" />

          {/* Version badge */}
          <a
            href={release.url}
            target="_blank"
            rel="noopener noreferrer"
            className="vocs:inline-flex vocs:items-center vocs:gap-1.5 vocs:text-sm vocs:font-mono vocs:font-medium vocs:text-heading vocs:bg-surfaceTint vocs:border vocs:border-primary vocs:px-2.5 vocs:py-1 vocs:rounded-md vocs:w-fit vocs:hover:bg-surfaceTint/80 vocs:transition-colors"
          >
            {release.version}
            <LucideExternalLink className="vocs:size-3 vocs:opacity-60" />
          </a>

          {/* Date */}
          <time dateTime={release.date} className="vocs:text-sm vocs:text-secondary">
            {formattedDate}
          </time>

          {/* Prerelease badge */}
          {release.prerelease && <Badge variant="warning">Pre-release</Badge>}
        </div>
      </div>

      {/* Timeline line */}
      {!isLast && (
        <div className="vocs:hidden vocs:md:block vocs:absolute vocs:left-36 vocs:top-8 vocs:bottom-0 vocs:ml-4 vocs:w-px vocs:border-l vocs:border-primary" />
      )}

      {/* Right column - content */}
      <div className="vocs:flex-1 vocs:min-w-0 vocs:py-6 vocs:border-b vocs:border-primary vocs:last:border-b-0">
        {/* Mobile version/date header */}
        <div className="vocs:md:hidden vocs:flex vocs:items-center vocs:gap-3 vocs:mb-4">
          <a
            href={release.url}
            target="_blank"
            rel="noopener noreferrer"
            className="vocs:inline-flex vocs:items-center vocs:gap-1.5 vocs:text-sm vocs:font-mono vocs:font-medium vocs:text-heading vocs:bg-surfaceTint vocs:border vocs:border-primary vocs:px-2.5 vocs:py-1 vocs:rounded-md vocs:hover:bg-surfaceTint/80 vocs:transition-colors"
          >
            {release.version}
            <LucideExternalLink className="vocs:size-3 vocs:opacity-60" />
          </a>
          <time dateTime={release.date} className="vocs:text-sm vocs:text-secondary">
            {formattedDate}
          </time>
          {release.prerelease && <Badge variant="warning">Pre-release</Badge>}
        </div>

        {/* Release title */}
        {release.title && release.title !== release.version && (
          <h2 className="vocs:text-2xl vocs:font-semibold vocs:text-heading vocs:mb-4">
            {release.title}
          </h2>
        )}

        {/* Release body */}
        <div className="vocs:relative">
          <div
            ref={contentRef}
            className={cx(
              'vocs:prose vocs:prose-sm vocs:max-w-none vocs:overflow-hidden vocs:transition-[max-height] vocs:duration-300',
              !expanded && needsExpansion && 'vocs:max-h-[600px]',
            )}
          >
            <Markdown html={release.bodyHtml ?? ''} />
          </div>

          {needsExpansion && !expanded && (
            <div className="vocs:absolute vocs:bottom-0 vocs:left-0 vocs:right-0 vocs:pt-16 vocs:pb-2 vocs:flex vocs:justify-center vocs:bg-gradient-to-t vocs:from-surface vocs:to-transparent">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="vocs:inline-flex vocs:items-center vocs:gap-1.5 vocs:px-3 vocs:py-1.5 vocs:text-sm vocs:font-medium vocs:text-heading vocs:bg-surfaceTint vocs:hover:bg-surfaceTint/80 vocs:border vocs:border-primary vocs:rounded-md vocs:transition-colors vocs:cursor-pointer"
              >
                Show more
                <LucideChevronDown className="vocs:size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

declare namespace Release {
  type Props = {
    release: ChangelogTypes.Release
    isLast?: boolean | undefined
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function Markdown(props: Markdown.Props): React.JSX.Element {
  const { html } = props

  return (
    <div
      className="vocs:space-y-6 vocs:[&>*:first-child]:mt-0 vocs:[&>*:last-child]:mb-0"
      data-v-content
      // biome-ignore lint/security/noDangerouslySetInnerHtml: _
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

declare namespace Markdown {
  type Props = {
    html: string
  }
}
