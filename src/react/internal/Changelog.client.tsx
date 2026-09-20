'use client'

import { cx } from 'cva'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { style, theme } from 'zyzz/default'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideExternalLink from '~icons/lucide/external-link'
import LucideHistory from '~icons/lucide/history'
import type * as ChangelogTypes from '../../internal/changelog.js'
import { Badge } from '../Badge.js'
import { Link } from '../Link.js'

namespace styles {
  export const versionIndicator = style({ backgroundColor: 'blue.700' })
  export const changelog = style({
    paddingBlock: 12,
    textAlign: 'center',
    color: theme.vars.color.gray['900'],
  })
  export const changelog2 = style({ position: 'relative' })
  export const changelog3 = style({ display: 'flex', width: '100%', flexDirection: 'column' })
  export const skeleton = style({
    display: 'flex',
    width: '100%',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    flexDirection: 'column',
  })
  export const skeleton2 = style({
    position: 'relative',
    display: 'flex',
    gap: 8,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    paddingBlock: 6,
    '@media (width >= 48rem)': { gap: 12 },
  })
  export const skeleton3 = style({
    display: 'none',
    width: 36,
    flexShrink: 0,
    '@media (width >= 48rem)': { display: 'block' },
  })
  export const skeleton4 = style({
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  })
  export const skeleton5 = style({
    height: 8,
    width: 24,
    borderRadius: 'md',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const skeleton6 = style({
    height: 4,
    width: 28,
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const skeleton7 = style({
    minWidth: 0,
    flex: 1,
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: 'calc(calc(0.25rem * 4) * 0)',
        marginBlockEnd: 'calc(calc(0.25rem * 4) * calc(1 - 0))',
      },
    },
  })
  export const skeleton8 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    '@media (width >= 48rem)': { display: 'none' },
  })
  export const skeleton9 = style({
    height: 7,
    width: 20,
    borderRadius: 'md',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const skeleton10 = style({
    height: 4,
    width: 24,
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const skeleton11 = style({
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: 'calc(calc(0.25rem * 3) * 0)',
        marginBlockEnd: 'calc(calc(0.25rem * 3) * calc(1 - 0))',
      },
    },
  })
  export const skeleton12 = style({
    height: 4,
    width: '100%',
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const skeleton13 = style({
    height: 4,
    width: 'calc(5 / 6 * 100%)',
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const skeleton14 = style({
    height: 4,
    width: 'calc(4 / 6 * 100%)',
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const skeleton15 = style({
    height: 4,
    width: 'calc(3 / 4 * 100%)',
    borderRadius: 'sm',
    backgroundColor: theme.vars.color.gray['100'],
  })
  export const versionOutline = style({
    position: 'fixed',
    top: 'calc(var(--vocs-layout-topNav) + var(--vocs-layout-banner) + 1.5rem)',
    right: 'max(2rem, calc((100vw - 1200px) / 2))',
    zIndex: 50,
    display: 'none',
    maxHeight: 'calc(100vh - var(--vocs-layout-topNav) - var(--vocs-layout-banner) - 3rem)',
    width: 48,
    fontSize: '13px',
    '@media (width >= 80rem)': { display: 'block' },
  })
  export const versionOutline2 = style({
    marginBottom: 3,
    display: 'flex',
    alignItems: 'center',
    gap: 'calc(0.25rem * 1.5)',
    fontSize: '13px',
    fontWeight: 'medium',
  })
  export const versionOutline3 = style({
    width: 'calc(0.25rem * 3.5)',
    height: 'calc(0.25rem * 3.5)',
  })
  export const versionOutline4 = style({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overscrollBehavior: 'contain',
    borderLeftStyle: 'solid',
    borderLeftWidth: '2px',
    borderColor: theme.vars.color.gray['400'],
  })
  export const versionOutline5 = style({ scrollMarginBlock: 'calc(0.25rem * 4)' })
  export const versionOutline6 = style({
    lineHeight: 'calc(1 / 0.75)',
    display: 'block',
    cursor: 'pointer',
    paddingBlock: 1,
    paddingLeft: 3,
    fontFamily: theme.vars.fontFamily.mono,
    fontSize: 'xs',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
  })
  export const versionOutline7 = style({ color: theme.vars.color.blue['900'] })
  export const versionOutline8 = style({
    color: theme.vars.color.gray['900'],
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const release = style({
    position: 'relative',
    display: 'flex',
    scrollMarginTop: 'calc(0.25rem * 20)',
    gap: 8,
    '@media (width >= 48rem)': { gap: 12 },
  })
  export const release2 = style({
    display: 'none',
    width: 36,
    flexShrink: 0,
    '@media (width >= 48rem)': { display: 'block' },
  })
  export const release3 = style({
    position: 'sticky',
    top: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingBlock: 6,
  })
  export const release4 = style({
    position: 'absolute',
    top: 8,
    left: 'calc(100% + 1rem)',
    zIndex: 10,
    height: 'calc(0.25rem * 2.5)',
    width: 'calc(0.25rem * 2.5)',
    borderRadius: 'calc(infinity * 1px)',
  })
  export const release5 = style({
    display: 'inline-flex',
    width: 'fit-content',
    maxWidth: '100%',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'calc(0.25rem * 1.5)',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.gray['100'],
    paddingInline: 'calc(0.25rem * 2.5)',
    paddingBlock: 1,
    fontFamily: theme.vars.fontFamily.mono,
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: `color-mix(in oklab, ${theme.vars.color.gray['100']} 80%, transparent)`,
        },
      },
    },
  })
  export const release6 = style({ minWidth: 0, wordBreak: 'break-all' })
  export const release7 = style({
    width: 3,
    height: 3,
    flexShrink: 0,
    opacity: '60%',
  })
  export const release8 = style({
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: theme.vars.color.gray['900'],
  })
  export const release9 = style({ width: 'fit-content' })
  export const release10 = style({
    position: 'absolute',
    top: 8,
    bottom: 0,
    left: 36,
    marginLeft: 4,
    display: 'none',
    width: '1px',
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    '@media (width >= 48rem)': { display: 'block' },
  })
  export const release11 = style({
    minWidth: 0,
    flex: 1,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    paddingBlock: 6,
    selectors: { '&:last-child': { borderBottomStyle: 'solid', borderBottomWidth: '0px' } },
  })
  export const release12 = style({
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    '@media (width >= 48rem)': { display: 'none' },
  })
  export const release13 = style({
    display: 'inline-flex',
    maxWidth: '100%',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'calc(0.25rem * 1.5)',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.gray['100'],
    paddingInline: 'calc(0.25rem * 2.5)',
    paddingBlock: 1,
    fontFamily: theme.vars.fontFamily.mono,
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: `color-mix(in oklab, ${theme.vars.color.gray['100']} 80%, transparent)`,
        },
      },
    },
  })
  export const release14 = style({ minWidth: 0, wordBreak: 'break-all' })
  export const release15 = style({
    width: 3,
    height: 3,
    flexShrink: 0,
    opacity: '60%',
  })
  export const release16 = style({
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: theme.vars.color.gray['900'],
  })
  export const release17 = style({
    marginBottom: 4,
    fontSize: '2xl',
    lineHeight: 'calc(2 / 1.5)',
    fontWeight: 'semibold',
    color: theme.vars.color.foreground,
  })
  export const release18 = style({ position: 'relative' })
  export const release19 = style({
    maxWidth: 'none',
    overflow: 'hidden',
    transitionProperty: 'max-height',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '300ms',
  })
  export const release20 = style({ maxHeight: '600px' })
  export const release21 = style({
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    justifyContent: 'center',
    backgroundImage: `linear-gradient(to top in oklab, ${theme.vars.color.surface}, transparent)`,
    paddingTop: 16,
    paddingBottom: 2,
  })
  export const release22 = style({
    display: 'inline-flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 'calc(0.25rem * 1.5)',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.gray['100'],
    paddingInline: 3,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: `color-mix(in oklab, ${theme.vars.color.gray['100']} 80%, transparent)`,
        },
      },
    },
  })
  export const release23 = style({ width: 4, height: 4 })
  export const markdown = style({
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: 'calc(calc(0.25rem * 6) * 0)',
        marginBlockEnd: 'calc(calc(0.25rem * 6) * calc(1 - 0))',
      },
      '&>*:first-child': { marginTop: 0 },
      '&>*:last-child': { marginBottom: 0 },
    },
  })
}

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
    return <div {...styles.changelog()}>No releases found.</div>
  }

  return (
    <div className={cx(styles.changelog2().className, className)} data-v-changelog>
      <div {...styles.changelog3()}>
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
    <div {...styles.skeleton()} data-v-changelog>
      {[1, 2, 3].map((i) => (
        <div key={i} {...styles.skeleton2()}>
          {/* Left column skeleton */}
          <div {...styles.skeleton3()}>
            <div {...styles.skeleton4()}>
              <div {...styles.skeleton5()} />
              <div {...styles.skeleton6()} />
            </div>
          </div>

          {/* Right column skeleton */}
          <div {...styles.skeleton7()}>
            {/* Mobile header skeleton */}
            <div {...styles.skeleton8()}>
              <div {...styles.skeleton9()} />
              <div {...styles.skeleton10()} />
            </div>

            {/* Content skeleton */}
            <div {...styles.skeleton11()}>
              <div {...styles.skeleton12()} />
              <div {...styles.skeleton13()} />
              <div {...styles.skeleton14()} />
              <div {...styles.skeleton15()} />
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
    <nav {...styles.versionOutline()} data-v-version-outline>
      <div {...styles.versionOutline2()}>
        <LucideHistory className={styles.versionOutline3().className} />
        Versions
      </div>

      <ul
        ref={containerRef}
        {...styles.versionOutline4()}
        style={{ maxHeight: 'calc(100vh - 12rem)', overflowY: 'auto', scrollbarWidth: 'thin' }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: -2,
            width: 2,
            borderRadius: 9999,

            transition: 'transform 150ms ease-out, height 150ms ease-out',
            zIndex: 10,
            ...indicatorStyle,
          }}
          {...styles.versionIndicator()}
          data-v-version-indicator
        />

        {releases.map((release) => {
          const isActive = activeVersion === release.version
          return (
            <li
              key={release.version}
              data-v-version-item
              data-version={release.version}
              {...styles.versionOutline5()}
            >
              <Link
                to={`#${release.version}`}
                className={cx(
                  styles.versionOutline6().className,
                  isActive
                    ? styles.versionOutline7().className
                    : styles.versionOutline8().className,
                )}
                data-active={isActive}
              >
                {release.version}
              </Link>
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
    <article id={release.version} {...styles.release()} data-v-changelog-release>
      {/* Left column - sticky version/date */}
      <div {...styles.release2()}>
        <div {...styles.release3()}>
          {/* Timeline dot */}
          <div {...styles.release4()} />

          {/* Version badge */}
          <a href={release.url} target="_blank" rel="noopener noreferrer" {...styles.release5()}>
            <span {...styles.release6()}>{release.version}</span>
            <LucideExternalLink className={styles.release7().className} />
          </a>

          {/* Date */}
          <time dateTime={release.date} {...styles.release8()}>
            {formattedDate}
          </time>

          {/* Prerelease badge */}
          {release.prerelease && (
            <Badge variant="warning" className={styles.release9().className}>
              Pre-release
            </Badge>
          )}
        </div>
      </div>

      {/* Timeline line */}
      {!isLast && <div {...styles.release10()} />}

      {/* Right column - content */}
      <div {...styles.release11()}>
        {/* Mobile version/date header */}
        <div {...styles.release12()}>
          <a href={release.url} target="_blank" rel="noopener noreferrer" {...styles.release13()}>
            <span {...styles.release14()}>{release.version}</span>
            <LucideExternalLink className={styles.release15().className} />
          </a>
          <time dateTime={release.date} {...styles.release16()}>
            {formattedDate}
          </time>
          {release.prerelease && <Badge variant="warning">Pre-release</Badge>}
        </div>

        {/* Release title */}
        {release.title && release.title !== release.version && (
          <h2 {...styles.release17()}>{release.title}</h2>
        )}

        {/* Release body */}
        <div {...styles.release18()}>
          <div
            ref={contentRef}
            className={cx(
              styles.release19().className,
              !expanded && needsExpansion && styles.release20().className,
            )}
          >
            <Markdown html={release.bodyHtml ?? ''} />
          </div>

          {needsExpansion && !expanded && (
            <div {...styles.release21()}>
              <button type="button" onClick={() => setExpanded(true)} {...styles.release22()}>
                Show more
                <LucideChevronDown className={styles.release23().className} />
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
      {...styles.markdown()}
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
