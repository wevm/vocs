'use client'

import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideArrowLeft from '~icons/lucide/arrow-left'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideChevronRight from '~icons/lucide/chevron-right'
import * as Path from '../../internal/path.js'
import * as Sidebar_core from '../../internal/sidebar.js'
import { Badge } from '../Badge.js'
import { Link } from '../Link.js'
import { useSidebar } from '../useSidebar.js'

namespace styles {
  export const sidebar = style({
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    fontWeight: 'medium',
    selectors: {
      "&>*:not(:last-child)[data-collapsed='false']": { marginBottom: 4 },
    },
  })
  export const backLink = style({
    marginBottom: 4,
    marginLeft: 'calc(0.25rem * -0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: 'calc(0.25rem * 1.5)',
    color: theme.vars.color.gray['900'],
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const backLink2 = style({ width: 4, height: 4 })
  export const itemBadge = style({ marginLeft: 2, flexShrink: 0 })
  export const item = style({
    display: 'inline-flex',
    minWidth: 0,
    alignItems: 'center',
    gap: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  })
  export const item2 = style({
    width: 3,
    height: 3,
    flexShrink: 0,
  })
  export const item3 = style({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  })
  export const item4 = style({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  })
  export const element = style({
    marginInline: 'calc(0.25rem * -3)',
    marginBlock: 'calc(0.25rem * -0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'md',
    paddingInline: 3,
    paddingBlock: 'calc(0.25rem * 1.5)',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
    selectors: {
      '&:not(*[data-link])': { cursor: 'default' },
      '&[aria-disabled="true"]': { pointerEvents: 'none', cursor: 'not-allowed', opacity: '60%' },
      '&[data-active]': {
        backgroundColor: theme.vars.color.blue['300'],
        color: 'blue.900 !important',
      },
      '&[data-link]': {
        selectors: {
          '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } },
        },
      },
      '&[data-condensed="true"]': { paddingBlock: '0.3rem', fontSize: '13px' },
    },
  })
  export const section = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
  })
  export const section2 = style({ width: 3, height: 3 })
  export const section3 = style({
    marginRight: 'calc(0.25rem * -1)',
    marginLeft: 2,
    flexShrink: 0,
    borderRadius: 'md',
    padding: 1,
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 80%, transparent)`,
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const section4 = style({
    transitionProperty: 'transform, translate, scale, rotate',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '200ms',
    selectors: { '&[data-collapsed]': { rotate: '90deg' } },
  })
  export const section5 = style({
    display: 'inline-flex',
    minWidth: 0,
    alignItems: 'center',
  })
  export const section6 = style({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  })
  export const section7 = style({
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 80%, transparent)`,
  })
  export const section8 = style({
    transitionProperty: 'transform, translate, scale, rotate',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '200ms',
    selectors: { '&[data-collapsed]': { rotate: '90deg' } },
  })
  export const section9 = style({ height: '1em' })
  export const section10 = style({
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    paddingLeft: 4,
  })
  export const element2 = style({
    selectors: {
      '&[data-collapsable="true"]': {
        selectors: {
          '&:hover': {
            '@media (hover: hover)': { cursor: 'pointer', color: theme.vars.color.blue['900'] },
          },
        },
      },
    },
  })
  export const element3 = style({
    minWidth: 0,
    flex: 1,
    color: 'inherit',
    selectors: { '&:hover': { '@media (hover: hover)': { color: 'inherit' } } },
  })
  export const element4 = style({
    marginInline: 'calc(0.25rem * -3)',
    display: 'flex',
    height: '2.5em',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'md',
    paddingInline: 3,
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
    selectors: { '&[data-collapsable="true"]': { cursor: 'pointer' } },
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
        <nav className={cx(styles.sidebar().className, className)} data-v-sidebar>
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
    <Link
      className={styles.backLink().className}
      data-v-sidebar-back-link
      onClick={onNavigate}
      to="/"
    >
      <LucideArrowLeft className={styles.backLink2().className} />
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
      className={styles.itemBadge().className}
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
          className={Item.className}
          data-condensed={condensed && depth > 1}
          data-link={true}
          data-v-sidebar-item
          href={link}
          ref={itemRef as never}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
        >
          <span {...styles.item()}>
            {text}
            <LucideArrowUpRight className={styles.item2().className} />
          </span>
          {badge && <ItemBadge badge={badge} />}
        </a>
      )
    return (
      <Link
        className={Item.className}
        data-condensed={condensed && depth > 1}
        data-link={true}
        data-v-sidebar-item
        to={link}
        ref={itemRef as never}
        onClick={onNavigate}
        {...(active && { 'data-active': true })}
      >
        <span {...styles.item3()}>{text}</span>
        {badge && <ItemBadge badge={badge} />}
      </Link>
    )
  }
  return (
    <div
      aria-disabled={disabled}
      className={Item.className}
      data-condensed={condensed && depth > 1}
      data-link={link ? true : undefined}
      data-v-sidebar-item
      ref={itemRef as never}
    >
      <span {...styles.item4()}>{text}</span>
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

  export const className = styles.element().className
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
                className={depth > 0 ? Section.childHeaderClassName : Section.rootHeaderClassName}
                data-condensed={condensed && depth > 1}
                data-collapsed={collapsed}
                data-collapsable={collapsable}
                data-v-sidebar-section-header
                {...(groupLinkIsActive && { 'data-active': true })}
              >
                <Link className={Section.headerLinkClassName} onClick={onNavigate} to={link}>
                  <span {...styles.section()}>
                    {text}
                    {groupLinkIsExternal && (
                      <LucideArrowUpRight className={styles.section2().className} />
                    )}
                  </span>
                </Link>

                {badge && <ItemBadge badge={badge} />}

                {collapsable && (
                  <button
                    aria-expanded={!collapsed}
                    aria-label={`Toggle ${text} section`}
                    {...styles.section3()}
                    onClick={() => setCollapsed((x) => !x)}
                    type="button"
                  >
                    <LucideChevronRight
                      className={styles.section4().className}
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
                className={depth > 0 ? Section.childHeaderClassName : Section.rootHeaderClassName}
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
                <span {...styles.section5()}>
                  <span {...styles.section6()}>{text}</span>
                  {badge && <ItemBadge badge={badge} />}
                </span>

                {collapsable && (
                  <div {...styles.section7()}>
                    <LucideChevronRight
                      className={styles.section8().className}
                      {...(!collapsed ? { 'data-collapsed': false } : {})}
                    />
                  </div>
                )}
              </div>
            )

          // Empty header.
          return <div {...styles.section9()} data-empty />
        })()}

        {!collapsed && (
          <div
            className={depth > 0 ? styles.section10().className : ''}
            data-v-sidebar-section-content
          >
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

  export const childHeaderClassName = cx(Item.className, styles.element2().className)

  export const headerLinkClassName = styles.element3().className

  export const rootHeaderClassName = styles.element4().className
}
