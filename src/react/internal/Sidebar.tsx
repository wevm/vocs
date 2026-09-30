'use client'

import * as React from 'react'
import { useRouter } from 'waku'
import { cx } from 'zyzz'
import LucideArrowLeft from '~icons/lucide/arrow-left'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideChevronRight from '~icons/lucide/chevron-right'
import * as Path from '../../internal/path.js'
import * as Sidebar_core from '../../internal/sidebar.js'
import { style, vars } from '../../styles/zyzz.config.js'
import { Badge } from '../Badge.js'
import { Link } from '../Link.js'
import { useSidebar } from '../useSidebar.js'

namespace styles {
  export const root = style({
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    fontSize: 'sm',
    lineHeight: 'sm',
    fontWeight: '450 !custom',
    selectors: {
      "&>*:not(:last-child)[data-collapsed='false']": {
        marginBottom: '4',
      },
    },
  })

  export const backLink = style({
    marginBottom: '4',
    marginLeft: `calc(${vars.spacing.unit} * -0.5) !custom`,
    display: 'flex',
    alignItems: 'center',
    gap: 'oneAndHalf',
    color: 'secondary',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
    },
  })

  export const backIcon = style({
    width: '4',
    height: '4',
  })

  export const itemBadge = style({
    marginLeft: '2',
    flexShrink: 0,
  })

  export const itemIcon = style({
    display: 'inline-flex',
    minWidth: '0',
    alignItems: 'center',
    gap: '1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  })

  export const externalIcon = style({
    width: '3',
    height: '3',
    flexShrink: 0,
  })

  export const itemLabel = style({
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  })

  export const item = style({
    marginInline: `calc(${vars.spacing.unit} * -3) !custom`,
    marginBlock: `calc(${vars.spacing.unit} * -0.5) !custom`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'md',
    paddingInline: '3',
    paddingBlock: 'oneAndHalf',
    color: 'primary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.primary} 80%, transparent) !custom`,
    },
    selectors: {
      '&:not(*[data-link])': {
        cursor: 'default',
      },
      '&[aria-disabled="true"]': {
        pointerEvents: 'none',
        cursor: 'not-allowed',
        opacity: '60%',
      },
      '&[data-active]': {
        backgroundColor: 'accenta3',
        color: 'accent8 !important',
      },
      '&[data-link]': {
        selectors: {
          '&:hover': {
            '@media (hover: hover)': {
              color: 'heading',
            },
          },
        },
      },
      '&[data-condensed="true"]': {
        paddingBlock: '0.3rem !custom',
        fontSize: '13px !custom',
      },
    },
  })

  export const sectionIcon = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
  })

  export const sectionExternalIcon = style({
    width: '3',
    height: '3',
  })

  export const sectionToggle = style({
    marginRight: `calc(${vars.spacing.unit} * -1) !custom`,
    marginLeft: '2',
    flexShrink: 0,
    borderRadius: 'md',
    padding: '1',
    color: 'secondary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.secondary} 80%, transparent) !custom`,
    },
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
    },
  })

  export const sectionChevron = style({
    transitionProperty: 'transform, translate, scale, rotate',
    transitionTimingFunction: 'in-out',
    transitionDuration: '200ms !custom',
    selectors: {
      '&[data-collapsed]': {
        rotate: '90deg',
      },
    },
  })

  export const sectionToggleLabel = style({
    display: 'inline-flex',
    minWidth: '0',
    alignItems: 'center',
  })

  export const sectionLabel = style({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  })

  export const sectionHeading = style({
    color: 'secondary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.secondary} 80%, transparent) !custom`,
    },
  })

  export const emptyHeading = style({
    height: '1em !custom',
  })

  export const nestedSection = style({
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    borderColor: 'primary',
    paddingLeft: '4',
  })

  export const childHeading = style({
    selectors: {
      '&[data-collapsable="true"]': {
        selectors: {
          '&:hover': {
            '@media (hover: hover)': {
              cursor: 'pointer',
              color: 'accent',
            },
          },
        },
      },
    },
  })

  export const headingLink = style({
    minWidth: '0',
    flex: 1,
    color: 'inherit !custom',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'inherit !custom',
        },
      },
    },
  })

  export const rootHeading = style({
    marginInline: `calc(${vars.spacing.unit} * -3) !custom`,
    display: 'flex',
    height: '2.5em !custom',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'md',
    paddingInline: '3',
    fontWeight: 'medium',
    color: 'heading',
    selectors: {
      '&[data-collapsable="true"]': {
        cursor: 'pointer',
      },
    },
  })
}

const maxDepth = 5

/** Active in-page anchor id, for hash-link sidebar items (e.g. OpenAPI). */
const ActiveAnchorContext = React.createContext<string | null>(null)

/**
 * The set of in-page anchor ids that the sidebar links to on the current page.
 * Used so page-level items only defer their active state to corresponding
 * sidebar items — not to arbitrary headings or hash links for another page.
 */
const HashIdsContext = React.createContext<ReadonlySet<string>>(new Set())

/** Collects the `#fragment` ids of hash-link sidebar items for the current page. */
function collectHashIds(
  items: Sidebar_core.SidebarItem[],
  path: string,
  ids = new Set<string>(),
): Set<string> {
  const pagePath = path.split('#')[0] ?? path
  for (const item of items) {
    if (item.link?.includes('#') && !Path.isExternal(item.link)) {
      const [itemPath, id] = item.link.split('#')
      if (id && (!itemPath || Path.matches(pagePath, itemPath))) ids.add(id)
    }
    if (item.items) collectHashIds(item.items, pagePath, ids)
  }
  return ids
}

/**
 * Tracks the in-page section currently in view, so hash-link sidebar items
 * (used by the OpenAPI section) can show active state. Mirrors the Outline's
 * IntersectionObserver approach.
 */
function useActiveAnchor(hashIds: ReadonlySet<string>, path: string): string | null {
  const [activeId, setActiveId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (hashIds.size === 0 || typeof window === 'undefined') return

    // OpenAPI pages render inside `article[data-v-content]` too, so the generic
    // markdown selector would also match operation sub-headings (Parameters,
    // Responses, schema anchors, …) whose ids have no sidebar entry — hijacking
    // the active anchor as you scroll through a section. On those pages observe
    // only the group header (`<h1>`) and per-operation titles, which back the
    // hash-link sidebar items, so the active item persists across the section.
    const isOpenApi = document.querySelector('[data-v-openapi]') !== null
    const selector = isOpenApi
      ? '[data-v-openapi-h1][id], [data-v-openapi-operation-title][id]'
      : 'article[data-v-content] :is(h2, h3, h4, h5, h6)[id]'

    // Reset on every client-side navigation. If the destination hash belongs
    // to a nested heading without a sidebar item, keep its nearest preceding
    // sidebar anchor active instead of falling back to the page-level item.
    // Reading `path` here — rather than only `window.location` — keeps it a
    // genuine effect dependency so navigation reliably re-runs this.
    const hashFromPath = path.includes('#') ? path.slice(path.indexOf('#') + 1) : ''
    const hash = hashFromPath || (window.location.hash ? window.location.hash.slice(1) : '')
    let initialId = hashIds.has(hash) ? hash : null
    const target = hash ? document.getElementById(hash) : null
    if (!initialId && target) {
      for (const element of document.querySelectorAll(selector)) {
        const position = element.compareDocumentPosition(target)
        if (element === target || position & Node.DOCUMENT_POSITION_PRECEDING) break
        if (hashIds.has(element.id)) initialId = element.id
      }
    }
    setActiveId(initialId)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
      },
      { rootMargin: '0px 0px -80% 0px' },
    )

    const observeAll = () => {
      observer.disconnect()
      for (const element of document.querySelectorAll(selector)) {
        // Nested headings without matching sidebar items belong to the current
        // section. Observing them would reactivate the page-level item.
        if (!hashIds.has(element.id)) continue
        // Skip changelog release-body headings — they have no sidebar entry and
        // would hijack the active section as you scroll through the changelog.
        if (element.closest('[data-v-changelog]')) continue
        observer.observe(element)
      }
    }
    observeAll()

    const content =
      document.querySelector('article[data-v-content]') ??
      document.querySelector('[data-v-openapi]')
    const mutation = content ? new MutationObserver(observeAll) : null
    if (content && mutation) mutation.observe(content, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutation?.disconnect()
    }
  }, [hashIds, path])

  return activeId
}

export function Sidebar(props: Sidebar.Props) {
  const { className, onNavigate, scrollRef } = props

  const sidebar = useSidebar()
  const condenseSidebar = React.useMemo(
    () => Sidebar_core.length(sidebar.items, { startDepth: 2 }) > 25,
    [sidebar.items],
  )
  const { path } = useRouter()
  const hashIds = React.useMemo(() => collectHashIds(sidebar.items, path), [sidebar.items, path])
  const activeAnchor = useActiveAnchor(hashIds, path)

  return (
    <HashIdsContext.Provider value={hashIds}>
      <ActiveAnchorContext.Provider value={activeAnchor}>
        <nav {...styles.root({ className })} data-v-sidebar>
          {sidebar.backLink && <BackLink onNavigate={onNavigate} />}
          {sidebar.items.map((item, i) => (
            <Section
              key={`${item.text}-${i}`}
              {...item}
              condensed={condenseSidebar}
              onNavigate={onNavigate}
              scrollRef={scrollRef}
            />
          ))}
        </nav>
      </ActiveAnchorContext.Provider>
    </HashIdsContext.Provider>
  )
}

function BackLink(props: { onNavigate?: (() => void) | undefined }) {
  const { onNavigate } = props
  return (
    <Link {...styles.backLink()} data-v-sidebar-back-link onClick={onNavigate} to="/">
      <LucideArrowLeft {...styles.backIcon()} />
      <span>Back</span>
    </Link>
  )
}

export declare namespace Sidebar {
  export type Props = {
    className?: string | undefined
    onNavigate?: (() => void) | undefined
    scrollRef: React.RefObject<HTMLDivElement | null>
  }
}

/** @internal */
function ItemBadge(props: { badge: Sidebar_core.SidebarItemBadge }) {
  const badge =
    typeof props.badge === 'string' ? { text: props.badge, icon: undefined } : props.badge
  return (
    <Badge
      {...styles.itemBadge()}
      data-v-sidebar-item-badge
      data-v-icon={badge.icon ? '' : undefined}
      variant={badge.variant ?? 'info'}
    >
      {badge.icon && (
        <span
          aria-hidden
          data-v-sidebar-item-badge-icon
          // biome-ignore lint/security/noDangerouslySetInnerHtml: server-resolved SVG markup
          dangerouslySetInnerHTML={{ __html: badge.icon }}
        />
      )}
      {badge.text}
    </Badge>
  )
}

/** @internal */
// biome-ignore lint/correctness/noUnusedVariables: _
function Item(props: Item.Props) {
  const {
    badge,
    condensed = false,
    depth = 0,
    disabled,
    external,
    link,
    onNavigate,
    scrollRef,
    text,
  } = props

  const { path } = useRouter()
  const isExternal = external ?? Path.isExternal(link)
  const activeAnchor = React.useContext(ActiveAnchorContext)
  const hashIds = React.useContext(HashIdsContext)
  const hashId = link?.includes('#') ? link.split('#')[1] : undefined
  const active = React.useMemo(() => {
    if (isExternal) return false
    if (hashId) return hashId === activeAnchor
    if (!Path.matches(path, link)) return false
    // Page-level item (e.g. the OpenAPI "Overview"). When in-page anchor
    // tracking is active, only highlight it while viewing the top of the page —
    // i.e. when the active section is the page's top heading (whose id matches
    // the last path segment) or no section is active yet. Otherwise the matching
    // anchor item below it is highlighted instead.
    if (activeAnchor == null) return true
    const topId = (link?.split('#')[0] ?? '').split('/').filter(Boolean).pop()
    if (activeAnchor === topId) return true
    // Only defer to the active anchor when it corresponds to an actual hash-link
    // sidebar item (a sibling section on this same page). Otherwise the anchor is
    // just an in-page heading on a standalone guide page that lives under a
    // section whose sidebar uses hash links elsewhere — keep this item active.
    return !hashIds.has(activeAnchor)
  }, [path, link, isExternal, hashId, activeAnchor, hashIds])

  const itemRef = React.useRef<HTMLElement>(null)
  const prevPath = React.useRef(path)
  React.useEffect(() => {
    const match = Path.matches(path, link)
    if (!match) return

    const pathChanged = prevPath.current !== path
    prevPath.current = path

    requestAnimationFrame(() => {
      const item = itemRef.current
      const container = scrollRef?.current
      if (!item || !container) return

      const itemTop = item.offsetTop
      const itemBottom = itemTop + item.offsetHeight
      const containerScrollTop = container.scrollTop
      const containerHeight = container.clientHeight

      const isVisible =
        itemTop >= containerScrollTop && itemBottom <= containerScrollTop + containerHeight

      if (isVisible) return

      container.scrollTo({
        behavior: pathChanged ? 'smooth' : 'instant',
        top: itemTop - 100,
      })
    })
  }, [link, path, scrollRef])

  // Keep the active in-page anchor item (OpenAPI endpoints) visible as the page
  // scrolls, since `path` doesn't change between same-page anchors.
  React.useEffect(() => {
    if (!active || !hashId) return
    const item = itemRef.current
    const container = scrollRef?.current
    if (!item || !container) return

    const itemTop = item.offsetTop
    const itemBottom = itemTop + item.offsetHeight
    const containerScrollTop = container.scrollTop
    const containerHeight = container.clientHeight

    if (itemTop >= containerScrollTop && itemBottom <= containerScrollTop + containerHeight) return

    container.scrollTo({ behavior: 'smooth', top: itemTop - 100 })
  }, [active, hashId, scrollRef])

  if (link && !disabled) {
    if (isExternal)
      return (
        <a
          {...styles.item()}
          data-condensed={condensed && depth > 1}
          data-link={true}
          data-v-sidebar-item
          href={link}
          ref={itemRef as never}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
        >
          <span {...styles.itemIcon()}>
            {text}
            <LucideArrowUpRight {...styles.externalIcon()} />
          </span>
          {badge && <ItemBadge badge={badge} />}
        </a>
      )
    return (
      <Link
        {...styles.item()}
        data-condensed={condensed && depth > 1}
        data-link={true}
        data-v-sidebar-item
        to={link}
        ref={itemRef as never}
        onClick={onNavigate}
        {...(active && { 'data-active': true })}
      >
        <span {...styles.itemLabel()}>{text}</span>
        {badge && <ItemBadge badge={badge} />}
      </Link>
    )
  }
  return (
    <div
      aria-disabled={disabled}
      {...styles.item()}
      data-condensed={condensed && depth > 1}
      data-link={link ? true : undefined}
      data-v-sidebar-item
      ref={itemRef as never}
    >
      <span {...styles.itemLabel()}>{text}</span>
      {badge && <ItemBadge badge={badge} />}
    </div>
  )
}

namespace Item {
  export type Props = Sidebar_core.SidebarItem & {
    condensed?: boolean | undefined
    depth?: number | undefined
    onNavigate?: (() => void) | undefined
    scrollRef?: React.RefObject<HTMLDivElement | null>
  }
}

/** @internal */
// biome-ignore lint/correctness/noUnusedVariables: _
function Section(props: Section.Props) {
  const { badge, condensed = false, depth = 0, link, items, onNavigate, scrollRef, text } = props

  const { path } = useRouter()
  const groupLinkIsExternal = link ? Path.isExternal(link) : false
  const groupLinkIsActive = React.useMemo(
    () => Boolean(link && !groupLinkIsExternal && Path.matches(path, link)),
    [groupLinkIsExternal, link, path],
  )

  const hasActiveChildItem = React.useMemo(() => {
    if (!items) return false

    function hasActiveChildItem(items: Sidebar_core.SidebarItem[], path: string) {
      if (!items) return false
      for (const item of items) {
        if (Path.matches(path, item.link)) return true
        if (item.link === path) return true
        if (!item.items) continue
        if (hasActiveChildItem(item.items, path)) return true
      }
      return false
    }

    return hasActiveChildItem(items, path)
  }, [items, path])

  const [collapsed, setCollapsed] = React.useState(() => {
    if (!items) return false
    if (hasActiveChildItem) return false
    if (props.disabled) return false
    return Boolean(props.collapsed)
  })

  React.useEffect(() => {
    if (hasActiveChildItem) setCollapsed(false)
  }, [hasActiveChildItem])

  const collapsable = typeof props.collapsed === 'boolean' && !props.disabled
  const onCollapseInteraction = React.useCallback(
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if ('key' in event && event.key !== 'Enter') return
      setCollapsed((x) => !x)
    },
    [],
  )

  if (items)
    return (
      <section data-collapsed={collapsed} data-v-sidebar-section>
        {(() => {
          if (text && link)
            return (
              <div
                {...cx(
                  depth > 0 && styles.item(),
                  depth > 0 && styles.childHeading(),
                  !(depth > 0) && styles.rootHeading(),
                )}
                data-condensed={condensed && depth > 1}
                data-collapsed={collapsed}
                data-collapsable={collapsable}
                data-v-sidebar-section-header
                {...(groupLinkIsActive && { 'data-active': true })}
              >
                <Link {...styles.headingLink()} onClick={onNavigate} to={link}>
                  <span {...styles.sectionIcon()}>
                    {text}
                    {groupLinkIsExternal && (
                      <LucideArrowUpRight {...styles.sectionExternalIcon()} />
                    )}
                  </span>
                </Link>

                {badge && <ItemBadge badge={badge} />}

                {collapsable && (
                  <button
                    aria-expanded={!collapsed}
                    aria-label={`Toggle ${text} section`}
                    {...styles.sectionToggle()}
                    onClick={() => setCollapsed((x) => !x)}
                    type="button"
                  >
                    <LucideChevronRight
                      {...styles.sectionChevron()}
                      {...(!collapsed ? { 'data-collapsed': false } : {})}
                    />
                  </button>
                )}
              </div>
            )

          // Non-link item is a header.
          if (text)
            return (
              <div
                {...cx(
                  depth > 0 && styles.item(),
                  depth > 0 && styles.childHeading(),
                  !(depth > 0) && styles.rootHeading(),
                )}
                data-condensed={condensed && depth > 1}
                data-collapsed={collapsed}
                data-collapsable={collapsable}
                data-v-sidebar-section-header
                {...(collapsable
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      onClick: onCollapseInteraction,
                      onKeyDown: onCollapseInteraction,
                    }
                  : {})}
              >
                <span {...styles.sectionToggleLabel()}>
                  <span {...styles.sectionLabel()}>{text}</span>
                  {badge && <ItemBadge badge={badge} />}
                </span>

                {collapsable && (
                  <div {...styles.sectionHeading()}>
                    <LucideChevronRight
                      {...styles.sectionChevron()}
                      {...(!collapsed ? { 'data-collapsed': false } : {})}
                    />
                  </div>
                )}
              </div>
            )

          // Empty header.
          return <div {...styles.emptyHeading()} data-empty />
        })()}

        {!collapsed && (
          <div {...cx(depth > 0 && styles.nestedSection())} data-v-sidebar-section-content>
            {items.length > 0 &&
              depth < maxDepth &&
              items.map((item, i) => (
                <Section
                  key={`${item.text}${i}`}
                  {...item}
                  condensed={condensed}
                  depth={depth + 1}
                  onNavigate={onNavigate}
                  scrollRef={scrollRef}
                />
              ))}
          </div>
        )}
      </section>
    )

  return <Item {...props} />
}

namespace Section {
  export type Props = Sidebar_core.SidebarItem & {
    condensed?: boolean | undefined
    depth?: number | undefined
    onNavigate?: (() => void) | undefined
    scrollRef: React.RefObject<HTMLDivElement | null>
  }
}
