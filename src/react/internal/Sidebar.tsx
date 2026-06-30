'use client'

import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideArrowLeft from '~icons/lucide/arrow-left'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideChevronRight from '~icons/lucide/chevron-right'
import * as Path from '../../internal/path.js'
import * as Sidebar_core from '../../internal/sidebar.js'
import { Badge } from '../Badge.js'
import { Link } from '../Link.js'
import { useSidebar } from '../useSidebar.js'

const maxDepth = 5

/** Active in-page anchor id, for hash-link sidebar items (e.g. OpenAPI). */
const ActiveAnchorContext = React.createContext<string | null>(null)

/**
 * The set of in-page anchor ids that the sidebar actually links to (the `#frag`
 * of every hash-link item). Used so page-level items only defer their active
 * state to anchors that have a corresponding sidebar item — not to arbitrary
 * headings on a standalone guide page that happens to live under a section
 * whose sidebar uses hash links elsewhere.
 */
const HashIdsContext = React.createContext<ReadonlySet<string>>(new Set())

/** Whether any sidebar item links to an in-page anchor. */
function hasHashLink(items: Sidebar_core.SidebarItem[]): boolean {
  return items.some((item) => item.link?.includes('#') || (item.items && hasHashLink(item.items)))
}

/** Collects the `#fragment` ids of every hash-link sidebar item. */
function collectHashIds(items: Sidebar_core.SidebarItem[], ids = new Set<string>()): Set<string> {
  for (const item of items) {
    if (item.link?.includes('#')) {
      const id = item.link.split('#')[1]
      if (id) ids.add(id)
    }
    if (item.items) collectHashIds(item.items, ids)
  }
  return ids
}

/**
 * Tracks the in-page section currently in view, so hash-link sidebar items
 * (used by the OpenAPI section) can show active state. Mirrors the Outline's
 * IntersectionObserver approach.
 */
function useActiveAnchor(enabled: boolean, path: string): string | null {
  const [activeId, setActiveId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Reset on every client-side navigation: derive the active section from the
    // hash of the destination `path` (landing pages like the OpenAPI section
    // root have none, so they start with no active section). Reading `path`
    // here — rather than only `window.location` — keeps it a genuine effect
    // dependency so navigation reliably re-runs this.
    const hashFromPath = path.includes('#') ? path.slice(path.indexOf('#') + 1) : ''
    const hash = hashFromPath || (window.location.hash ? window.location.hash.slice(1) : '')
    setActiveId(hash || null)

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
  }, [enabled, path])

  return activeId
}

export function Sidebar(props: Sidebar.Props) {
  const { className, onNavigate, scrollRef } = props

  const sidebar = useSidebar()
  const condenseSidebar = React.useMemo(
    () => Sidebar_core.length(sidebar.items, { startDepth: 2 }) > 25,
    [sidebar.items],
  )
  const hashLinks = React.useMemo(() => hasHashLink(sidebar.items), [sidebar.items])
  const hashIds = React.useMemo(() => collectHashIds(sidebar.items), [sidebar.items])
  const { path } = useRouter()
  const activeAnchor = useActiveAnchor(hashLinks, path)

  return (
    <HashIdsContext.Provider value={hashIds}>
      <ActiveAnchorContext.Provider value={activeAnchor}>
        <nav
          className={cx(
            "vocs:flex-1 vocs:flex vocs:flex-col vocs:text-sm vocs:font-[450] vocs:[&>*:not(:last-child)[data-collapsed='false']]:mb-4",
            className,
          )}
          data-v-sidebar
        >
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
      className="vocs:flex vocs:items-center vocs:gap-1.5 vocs:text-secondary vocs:hover:text-heading vocs:mb-4 vocs:-ml-0.5"
      data-v-sidebar-back-link
      onClick={onNavigate}
      to="/"
    >
      <LucideArrowLeft className="vocs:size-4" />
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
  const badge = typeof props.badge === 'string' ? { text: props.badge } : props.badge
  return (
    <Badge
      className="vocs:shrink-0 vocs:ml-2"
      data-v-sidebar-item-badge
      variant={badge.variant ?? 'info'}
    >
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
          <span className="vocs:inline-flex vocs:items-center vocs:gap-1 vocs:min-w-0 vocs:truncate">
            {text}
            <LucideArrowUpRight className="vocs:size-3 vocs:shrink-0" />
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
        <span className="vocs:min-w-0 vocs:truncate">{text}</span>
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
      <span className="vocs:min-w-0 vocs:truncate">{text}</span>
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

  export const className =
    'vocs:flex vocs:data-link:hover:text-heading vocs:not-data-link:cursor-default vocs:justify-between vocs:-mx-3 vocs:px-3 vocs:py-1.5 vocs:text-primary/80 vocs:-my-0.5 vocs:items-center vocs:rounded-md vocs:data-active:bg-accenta3 vocs:data-active:text-accent8! vocs:aria-disabled:opacity-60 vocs:aria-disabled:cursor-not-allowed vocs:aria-disabled:pointer-events-none vocs:data-[condensed=true]:text-[13px] vocs:data-[condensed=true]:py-[0.3rem]'
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
                  <span className="vocs:inline-flex vocs:items-center vocs:gap-1">
                    {text}
                    {groupLinkIsExternal && <LucideArrowUpRight className="vocs:size-3" />}
                  </span>
                </Link>

                {badge && <ItemBadge badge={badge} />}

                {collapsable && (
                  <button
                    aria-expanded={!collapsed}
                    aria-label={`Toggle ${text} section`}
                    className="vocs:ml-2 vocs:-mr-1 vocs:shrink-0 vocs:rounded-md vocs:p-1 vocs:text-secondary/80 vocs:hover:text-heading"
                    onClick={() => setCollapsed((x) => !x)}
                    type="button"
                  >
                    <LucideChevronRight
                      className="vocs:data-collapsed:rotate-90 vocs:transition-transform vocs:duration-200 vocs:ease-in-out"
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
                <span className="vocs:inline-flex vocs:items-center vocs:min-w-0">
                  <span className="vocs:truncate">{text}</span>
                  {badge && <ItemBadge badge={badge} />}
                </span>

                {collapsable && (
                  <div className="vocs:text-secondary/80">
                    <LucideChevronRight
                      className="vocs:data-collapsed:rotate-90 vocs:transition-transform vocs:duration-200 vocs:ease-in-out"
                      {...(!collapsed ? { 'data-collapsed': false } : {})}
                    />
                  </div>
                )}
              </div>
            )

          // Empty header.
          return <div className="vocs:h-[1em]" data-empty />
        })()}

        {!collapsed && (
          <div
            className={depth > 0 ? 'vocs:pl-4 vocs:border-l vocs:border-primary' : ''}
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

  export const childHeaderClassName = cx(
    Item.className,
    'vocs:data-[collapsable=true]:hover:text-accent vocs:data-[collapsable=true]:hover:cursor-pointer',
  )

  export const headerLinkClassName =
    'vocs:flex-1 vocs:min-w-0 vocs:text-inherit vocs:hover:text-inherit'

  export const rootHeaderClassName =
    'vocs:h-[2.5em] vocs:px-3 vocs:-mx-3 vocs:rounded-md vocs:flex vocs:items-center vocs:justify-between vocs:text-heading vocs:font-medium vocs:data-[collapsable=true]:cursor-pointer'
}
