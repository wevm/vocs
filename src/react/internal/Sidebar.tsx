'use client'

import { cx } from 'cva'
import * as React from 'react'
import { Link, useRouter } from 'waku'
import LucideChevronRight from '~icons/lucide/chevron-right'
import * as Sidebar_core from '../../internal/sidebar.js'
import { useSidebar } from '../useSidebar.js'

const maxDepth = 5

export function Sidebar(props: Sidebar.Props) {
  const { className, scrollRef } = props

  const sidebar = useSidebar()
  const condenseSidebar = React.useMemo(
    () => Sidebar_core.length(sidebar.items, { startDepth: 2 }) > 25,
    [sidebar.items],
  )

  return (
    <nav
      className={cx(
        "vocs:flex-1 vocs:flex vocs:flex-col vocs:text-sm vocs:font-[450] vocs:[&>*:not(:last-child)[data-collapsed='false']]:mb-4",
        className,
      )}
      data-v-sidebar
    >
      {sidebar.items.map((item, i) => (
        <Section
          key={`${item.text}-${i}`}
          {...item}
          condensed={condenseSidebar}
          scrollRef={scrollRef}
        />
      ))}
    </nav>
  )
}

export declare namespace Sidebar {
  export type Props = {
    className?: string | undefined
    scrollRef: React.RefObject<HTMLDivElement | null>
  }
}

/** @internal */
// biome-ignore lint/correctness/noUnusedVariables: _
function Item(props: Item.Props) {
  const { condensed = false, depth = 0, disabled, link, scrollRef, text } = props

  const { path } = useRouter()
  const active = React.useMemo(() => matchPath(path, link), [path, link])

  const itemRef = React.useRef<HTMLElement>(null)
  const listen = React.useRef(true)
  React.useEffect(() => {
    if (!listen.current) return
    listen.current = false

    const match = matchPath(path, link)
    if (!match) return

    requestAnimationFrame(() => {
      const offsetTop = itemRef.current?.offsetTop ?? 0
      const navHeight = (scrollRef?.current?.clientHeight ?? 0) - 120
      if (offsetTop < navHeight) return
      scrollRef?.current?.scrollTo({ behavior: 'smooth', top: offsetTop - 100 })
    })
  }, [link, path, scrollRef])

  if (link && !disabled)
    return (
      <Link
        className={Item.className}
        data-condensed={condensed && depth > 1}
        data-link={true}
        data-v-sidebar-item
        to={link}
        ref={itemRef as never}
        unstable_prefetchOnView
        {...(active && { 'data-active': true })}
      >
        {text}
      </Link>
    )
  return (
    <div
      aria-disabled={disabled}
      className={Item.className}
      data-condensed={condensed && depth > 1}
      data-link={link ? true : undefined}
      data-v-sidebar-item
      ref={itemRef as never}
    >
      {text}
    </div>
  )
}

namespace Item {
  export type Props = Sidebar_core.SidebarItem & {
    condensed?: boolean | undefined
    depth?: number | undefined
    scrollRef?: React.RefObject<HTMLDivElement | null>
  }

  export const className =
    'vocs:flex vocs:data-link:hover:text-heading vocs:not-data-link:cursor-default vocs:justify-between vocs:-mx-3 vocs:px-3 vocs:py-1.5 vocs:text-primary/80 vocs:-my-0.5 vocs:items-center vocs:rounded-md vocs:data-active:bg-darkHover vocs:data-active:text-heading vocs:aria-disabled:opacity-60 vocs:aria-disabled:cursor-not-allowed vocs:aria-disabled:pointer-events-none vocs:data-[condensed=true]:text-[13px] vocs:data-[condensed=true]:py-[0.3rem]'
}

/** @internal */
// biome-ignore lint/correctness/noUnusedVariables: _
function Section(props: Section.Props) {
  const { condensed = false, depth = 0, link, items, scrollRef, text } = props

  const { path } = useRouter()

  const hasActiveChildItem = React.useMemo(() => {
    if (!items) return false

    function getActiveChildItem(items: Sidebar_core.SidebarItem[], path: string) {
      if (!items) return false
      for (const item of items) {
        if (matchPath(path, item.link)) return true
        if (item.link === path) return true
        if (!item.items) continue
        if (getActiveChildItem(item.items, path)) return true
      }
      return false
    }

    return getActiveChildItem(items, path)
  }, [items, path])

  const [collapsed, setCollapsed] = React.useState(() => {
    if (!items) return false
    if (hasActiveChildItem) return false
    if (props.disabled) return false
    return Boolean(props.collapsed)
  })

  const collapsable = typeof props.collapsed === 'boolean' && !props.disabled
  const onCollapseInteraction = React.useCallback(
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if ('key' in event && event.key !== 'Enter') return
      setCollapsed((x) => !x)
    },
    [],
  )
  const onCollapseTriggerInteraction = React.useCallback(
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if ('key' in event && event.key !== 'Enter') return
      event.stopPropagation()
      setCollapsed((x) => !x)
    },
    [],
  )

  if (items)
    return (
      <section data-collapsed={collapsed} data-v-sidebar-section>
        {(() => {
          // Not a header if includes a link.
          if (link) return <Item {...props} />

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
                {text}

                {collapsable && (
                  <button
                    aria-label="toggle section"
                    className="vocs:text-secondary/80"
                    onClick={onCollapseTriggerInteraction}
                    onKeyDown={onCollapseTriggerInteraction}
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

          // Empty header.
          return <div className="vocs:h-[1em]" />
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
    scrollRef: React.RefObject<HTMLDivElement | null>
  }

  export const childHeaderClassName = cx(
    Item.className,
    'vocs:data-[collapsable=true]:hover:text-heading vocs:data-[collapsable=true]:hover:cursor-pointer',
  )

  export const rootHeaderClassName =
    'vocs:h-[2.5em] vocs:px-3 vocs:-mx-3 vocs:rounded-md vocs:flex vocs:items-center vocs:justify-between vocs:text-heading vocs:font-medium vocs:data-[collapsable=true]:cursor-pointer'
}

/** @internal */
function matchPath(pathname: string, path: string | undefined) {
  if (typeof path !== 'string') return false
  return new URLPattern({ pathname }).test(`https://example.com${path}`)
}
