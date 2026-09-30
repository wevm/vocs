'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cx } from 'zyzz'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideExternalLink from '~icons/lucide/external-link'
import LucideHistory from '~icons/lucide/history'
import type * as ChangelogTypes from '../../internal/changelog.js'
import { style, vars } from '../../styles/zyzz.config.js'
import { Badge } from '../Badge.js'
import { Link } from '../Link.js'

namespace styles {
  export const emptyState = style({
    paddingBlock: '12',
    textAlign: 'center',
    color: 'secondary',
  })

  export const root = style({
    position: 'relative',
  })

  export const loadingSentinel = style({
    display: 'flex',
    width: '100% !custom',
    flexDirection: 'column',
  })

  export const skeleton = style({
    display: 'flex',
    width: '100% !custom',
    animation: 'pulse',
    flexDirection: 'column',
  })

  export const skeletonRelease = style({
    position: 'relative',
    display: 'flex',
    gap: '8',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: 'primary',
    paddingBlock: '6',
    '@media (width >= 748px)': {
      gap: '12',
    },
  })

  export const skeletonOutline = style({
    display: 'none',
    width: '36',
    flexShrink: 0,
    '@media (width >= 748px)': {
      display: 'block',
    },
  })

  export const skeletonOutlineHeading = style({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
  })

  export const skeletonOutlineIcon = style({
    height: '8',
    width: '24',
    borderRadius: 'md',
    backgroundColor: 'surfaceTint',
  })

  export const skeletonOutlineLabel = style({
    height: '4',
    width: '28',
    borderRadius: '0.25rem !custom',
    backgroundColor: 'surfaceTint',
  })

  export const skeletonVersions = style({
    minWidth: '0',
    flex: 1,
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: '0 !custom',
        marginBlockEnd: '4',
      },
    },
  })

  export const skeletonVersion = style({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    '@media (width >= 748px)': {
      display: 'none',
    },
  })

  export const skeletonVersionLabel = style({
    height: '7',
    width: '20',
    borderRadius: 'md',
    backgroundColor: 'surfaceTint',
  })

  export const skeletonVersionDate = style({
    height: '4',
    width: '24',
    borderRadius: '0.25rem !custom',
    backgroundColor: 'surfaceTint',
  })

  export const skeletonContent = style({
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: '0 !custom',
        marginBlockEnd: '3',
      },
    },
  })

  export const skeletonHeading = style({
    height: '4',
    width: '100% !custom',
    borderRadius: '0.25rem !custom',
    backgroundColor: 'surfaceTint',
  })

  export const skeletonHeadingWide = style({
    height: '4',
    width: 'calc(5 / 6 * 100%) !custom',
    borderRadius: '0.25rem !custom',
    backgroundColor: 'surfaceTint',
  })

  export const skeletonParagraph = style({
    height: '4',
    width: 'calc(4 / 6 * 100%) !custom',
    borderRadius: '0.25rem !custom',
    backgroundColor: 'surfaceTint',
  })

  export const skeletonParagraphShort = style({
    height: '4',
    width: 'calc(3 / 4 * 100%) !custom',
    borderRadius: '0.25rem !custom',
    backgroundColor: 'surfaceTint',
  })

  export const versionOutline = style({
    position: 'fixed',
    top: `calc(${vars.spacing.topNav} + ${vars.spacing.banner} + 1.5rem) !custom`,
    right: 'max(2rem, calc((100vw - 1200px) / 2)) !custom',
    zIndex: 50,
    display: 'none',
    maxHeight: `calc(100vh - ${vars.spacing.topNav} - ${vars.spacing.banner} - 3rem) !custom`,
    width: '48',
    fontSize: '13px !custom',
    '@media (width >= 80rem)': {
      display: 'block',
    },
  })

  export const versionHeading = style({
    marginBottom: '3',
    display: 'flex',
    alignItems: 'center',
    gap: 'oneAndHalf',
    fontSize: '13px !custom',
    fontWeight: 'medium',
  })

  export const historyIcon = style({
    width: 'threeAndHalf',
    height: 'threeAndHalf',
  })

  export const versionList = style({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overscrollBehavior: 'contain',
    borderLeftStyle: 'solid',
    borderLeftWidth: '2px',
    borderColor: 'primary',
  })

  export const versionItem = style({
    scrollMarginBlock: '4',
  })

  export const versionLink = style({
    display: 'block',
    cursor: 'pointer',
    paddingBlock: '1',
    paddingLeft: '3',
    fontFamily: 'mono',
    fontSize: 'xs',
    lineHeight: 'xs',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: '100ms !custom',
  })

  export const activeVersionLink = style({
    color: 'accent',
  })

  export const inactiveVersionLink = style({
    color: 'secondary',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'link',
        },
      },
    },
  })

  export const release = style({
    position: 'relative',
    display: 'flex',
    scrollMarginTop: '20',
    gap: '8',
    '@media (width >= 748px)': {
      gap: '12',
    },
  })

  export const releaseHeader = style({
    position: 'sticky',
    top: '20',
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    paddingBlock: '6',
  })

  export const releaseMarker = style({
    position: 'absolute',
    top: '8',
    left: 'calc(100% + 1rem) !custom',
    zIndex: 10,
    height: 'twoAndHalf',
    width: 'twoAndHalf',
    borderRadius: 'calc(infinity * 1px) !custom',
  })

  export const releaseLink = style({
    display: 'inline-flex',
    width: 'fit-content !custom',
    maxWidth: '100% !custom',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'oneAndHalf',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surfaceTint',
    paddingInline: 'twoAndHalf',
    paddingBlock: '1',
    fontFamily: 'mono',
    fontSize: 'sm',
    lineHeight: 'sm',
    fontWeight: 'medium',
    color: 'heading',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceTint',
          '@supports (color: color-mix(in lab, red, red))': {
            backgroundColor: `color-mix(in oklab, ${vars.backgroundColor.surfaceTint} 80%, transparent) !custom`,
          },
        },
      },
    },
  })

  export const releaseVersion = style({
    minWidth: '0',
    wordBreak: 'break-all',
  })

  export const externalIcon = style({
    width: '3',
    height: '3',
    flexShrink: 0,
    opacity: '60%',
  })

  export const releaseDate = style({
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'secondary',
  })

  export const prereleaseBadge = style({
    width: 'fit-content !custom',
  })

  export const releaseDivider = style({
    position: 'absolute',
    top: '8',
    bottom: '0',
    left: '36',
    marginLeft: '4',
    display: 'none',
    width: '1px !custom',
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    borderColor: 'primary',
    '@media (width >= 748px)': {
      display: 'block',
    },
  })

  export const releaseContent = style({
    minWidth: '0',
    flex: 1,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: 'primary',
    paddingBlock: '6',
    selectors: {
      '&:last-child': {
        borderBottomStyle: 'solid',
        borderBottomWidth: '0px',
      },
    },
  })

  export const releaseTitle = style({
    marginBottom: '4',
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    '@media (width >= 748px)': {
      display: 'none',
    },
  })

  export const releaseTitleLink = style({
    display: 'inline-flex',
    maxWidth: '100% !custom',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'oneAndHalf',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surfaceTint',
    paddingInline: 'twoAndHalf',
    paddingBlock: '1',
    fontFamily: 'mono',
    fontSize: 'sm',
    lineHeight: 'sm',
    fontWeight: 'medium',
    color: 'heading',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceTint',
          '@supports (color: color-mix(in lab, red, red))': {
            backgroundColor: `color-mix(in oklab, ${vars.backgroundColor.surfaceTint} 80%, transparent) !custom`,
          },
        },
      },
    },
  })

  export const releaseHeading = style({
    marginBottom: '4',
    fontSize: '2xl',
    lineHeight: '2xl',
    fontWeight: 'semibold',
    color: 'heading',
  })

  export const releaseBody = style({
    maxWidth: 'none !custom',
    overflow: 'hidden',
    transitionProperty: 'max-height',
    transitionTimingFunction: 'standard',
    transitionDuration: '300ms !custom',
  })

  export const collapsedBody = style({
    maxHeight: '600px !custom',
  })

  export const expandGradient = style({
    position: 'absolute',
    right: '0',
    bottom: '0',
    left: '0',
    display: 'flex',
    justifyContent: 'center',
    backgroundImage: `linear-gradient(to top in oklab, ${vars.backgroundColor.surface} 0%, transparent 100%)`,
    paddingTop: '16',
    paddingBottom: '2',
  })

  export const expandButton = style({
    display: 'inline-flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 'oneAndHalf',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surfaceTint',
    paddingInline: '3',
    paddingBlock: 'oneAndHalf',
    fontSize: 'sm',
    lineHeight: 'sm',
    fontWeight: 'medium',
    color: 'heading',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceTint',
          '@supports (color: color-mix(in lab, red, red))': {
            backgroundColor: `color-mix(in oklab, ${vars.backgroundColor.surfaceTint} 80%, transparent) !custom`,
          },
        },
      },
    },
  })

  export const expandIcon = style({
    width: '4',
    height: '4',
  })

  export const markdown = style({
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: '0 !custom',
        marginBlockEnd: '6',
      },
      '&>*:first-child': {
        marginTop: '0',
      },
      '&>*:last-child': {
        marginBottom: '0',
      },
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
    return <div {...styles.emptyState()}>No releases found.</div>
  }

  return (
    <div {...styles.root({ className })} data-v-changelog>
      <div {...styles.loadingSentinel()}>
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
        <div key={i} {...styles.skeletonRelease()}>
          {/* Left column skeleton */}
          <div {...styles.skeletonOutline()}>
            <div {...styles.skeletonOutlineHeading()}>
              <div {...styles.skeletonOutlineIcon()} />
              <div {...styles.skeletonOutlineLabel()} />
            </div>
          </div>

          {/* Right column skeleton */}
          <div {...styles.skeletonVersions()}>
            {/* Mobile header skeleton */}
            <div {...styles.skeletonVersion()}>
              <div {...styles.skeletonVersionLabel()} />
              <div {...styles.skeletonVersionDate()} />
            </div>

            {/* Content skeleton */}
            <div {...styles.skeletonContent()}>
              <div {...styles.skeletonHeading()} />
              <div {...styles.skeletonHeadingWide()} />
              <div {...styles.skeletonParagraph()} />
              <div {...styles.skeletonParagraphShort()} />
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
      <div {...styles.versionHeading()}>
        <LucideHistory {...styles.historyIcon()} />
        Versions
      </div>

      <ul
        ref={containerRef}
        {...styles.versionList()}
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
              {...styles.versionItem()}
            >
              <Link
                to={`#${release.version}`}
                {...cx(
                  styles.versionLink(),
                  isActive && styles.activeVersionLink(),
                  !isActive && styles.inactiveVersionLink(),
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
      <div {...styles.skeletonOutline()}>
        <div {...styles.releaseHeader()}>
          {/* Timeline dot */}
          <div {...styles.releaseMarker()} />

          {/* Version badge */}
          <a href={release.url} target="_blank" rel="noopener noreferrer" {...styles.releaseLink()}>
            <span {...styles.releaseVersion()}>{release.version}</span>
            <LucideExternalLink {...styles.externalIcon()} />
          </a>

          {/* Date */}
          <time dateTime={release.date} {...styles.releaseDate()}>
            {formattedDate}
          </time>

          {/* Prerelease badge */}
          {release.prerelease && (
            <Badge variant="warning" {...styles.prereleaseBadge()}>
              Pre-release
            </Badge>
          )}
        </div>
      </div>

      {/* Timeline line */}
      {!isLast && <div {...styles.releaseDivider()} />}

      {/* Right column - content */}
      <div {...styles.releaseContent()}>
        {/* Mobile version/date header */}
        <div {...styles.releaseTitle()}>
          <a
            href={release.url}
            target="_blank"
            rel="noopener noreferrer"
            {...styles.releaseTitleLink()}
          >
            <span {...styles.releaseVersion()}>{release.version}</span>
            <LucideExternalLink {...styles.externalIcon()} />
          </a>
          <time dateTime={release.date} {...styles.releaseDate()}>
            {formattedDate}
          </time>
          {release.prerelease && <Badge variant="warning">Pre-release</Badge>}
        </div>

        {/* Release title */}
        {release.title && release.title !== release.version && (
          <h2 {...styles.releaseHeading()}>{release.title}</h2>
        )}

        {/* Release body */}
        <div {...styles.root()}>
          <div
            ref={contentRef}
            {...cx(styles.releaseBody(), !expanded && needsExpansion && styles.collapsedBody())}
          >
            <Markdown html={release.bodyHtml ?? ''} />
          </div>

          {needsExpansion && !expanded && (
            <div {...styles.expandGradient()}>
              <button type="button" onClick={() => setExpanded(true)} {...styles.expandButton()}>
                Show more
                <LucideChevronDown {...styles.expandIcon()} />
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
