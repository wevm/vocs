'use client'

import { cva } from 'cva'
import * as React from 'react'
import { Link, useRouter } from 'waku'
import LucideChevronRight from '~icons/lucide/chevron-right'
import type * as Sidebar from '../internal/sidebar.js'
import { useConfig } from './useConfig.js'
import { useSidebar } from './useSidebar.js'

export function Main(props: Main.Props) {
  const { children } = props

  const sidebar = useSidebar()

  return (
    <div>
      <div
        className="vocs:flex vocs:justify-end vocs:fixed vocs:h-topNav vocs:w-logo vocs:min-w-fit vocs:max-lg:w-fit vocs:z-20"
        data-v-gutter-logo
      >
        <div className="vocs:w-sidebar vocs:px-sidebar-px vocs:min-w-fit" data-v-logo>
          <Link to="/">
            <Logo />
          </Link>
        </div>
      </div>

      <div
        className="vocs:bg-dark vocs:flex vocs:justify-end vocs:fixed vocs:pt-topNav vocs:w-gutter vocs:h-screen vocs:z-10 vocs:max-lg:hidden"
        data-v-gutter-left
      >
        <aside
          className="vocs:w-sidebar vocs:px-sidebar-px vocs:py-sidebar-py vocs:h-full vocs:flex vocs:flex-col vocs:justify-between vocs:overflow-y-auto"
          data-v-sidebar
        >
          <nav
            className="vocs:flex-1 vocs:flex vocs:flex-col vocs:text-sm vocs:font-[450] vocs:[&>*:not(:last-child)[data-collapsed='false']]:mb-4"
            data-v-sidebar-content
          >
            {sidebar.items.map((item, i) => (
              <SidebarItem key={`${item.text}-${i}`} {...item} />
            ))}
          </nav>
          <div className="vocs:h-[60px]" data-v-sidebar-footer>
            {/* TODO */}
          </div>
        </aside>
      </div>

      <div
        className="vocs:bg-dark vocs:fixed vocs:flex vocs:lg:left-gutter vocs:w-[calc(100vw-var(--vocs-spacing-gutter))] vocs:pr-[calc(var(--vocs-spacing-gutter)-var(--vocs-spacing-sidebar))] vocs:h-topNav vocs:z-10"
        data-v-gutter-top
      >
        {/* TODO */}
      </div>

      <div className="vocs:fixed vocs:bg-primary vocs:lg:rounded-tl-2xl vocs:lg:border-l vocs:border-t vocs:border-primary vocs:w-[calc(100vw-var(--vocs-spacing-gutter))] vocs:h-full vocs:max-lg:w-full vocs:top-topNav vocs:lg:translate-x-gutter" />

      <main className="vocs:isolate vocs:pt-topNav vocs:w-full vocs:h-full" data-v-main>
        <article
          className="vocs:min-[1402px]:mx-auto vocs:max-[1402px]:translate-x-gutter vocs:max-lg:translate-x-0 vocs:px-content-px vocs:py-content-py vocs:relative vocs:w-full vocs:max-w-content vocs:space-y-6 vocs:max-md:overflow-x-hidden vocs:max-lg:mx-auto"
          data-v-content
        >
          {children}
        </article>
      </main>

      <div
        className="vocs:fixed vocs:w-gutter vocs:h-full vocs:right-0 vocs:top-topNav vocs:z-10"
        data-v-gutter-right
      >
        {/* TODO */}
      </div>
    </div>
  )
}

export namespace Main {
  export type Props = {
    children: React.ReactNode
  }
}

export function Logo() {
  const { logoUrl, title } = useConfig()

  return (
    <div className="vocs:flex vocs:items-center vocs:h-full vocs:py-3" data-v-logo>
      {(() => {
        if (!logoUrl)
          return (
            <div
              className="vocs:text-2xl vocs:text-heading vocs:tracking-tight vocs:font-bold"
              data-v-logo-text
            >
              {title}
            </div>
          )
        if (typeof logoUrl === 'string')
          return <img alt="Logo" className="vocs:h-full" data-v-logo-image src={logoUrl} />
        return (
          <>
            <img
              alt="Logo"
              className="vocs:h-full vocs:not-dark:hidden"
              data-v-logo-image
              src={logoUrl.dark}
            />
            <img
              alt="Logo"
              className="vocs:h-full vocs:dark:hidden"
              data-v-logo-image
              src={logoUrl.light}
            />
          </>
        )
      })()}
    </div>
  )
}

export namespace Logo {
  export type Props = {
    children: React.ReactNode
  }
}

// TODO:
// - collapsable items
// - disabled items
// - nested items
function matchPath(pathname: string, path: string | undefined) {
  if (typeof path !== 'string') return false
  return new URLPattern({ pathname }).test(`https://example.com${path}`)
}

export function SidebarItem(props: SidebarItem.Props) {
  const { depth = 0, disabled: _, items, link, text } = props

  const { path } = useRouter()
  const active = React.useMemo(() => matchPath(path, link), [path, link])

  const hasActiveChildItem = React.useMemo(() => {
    if (!items) return false

    // TODO: test deep nested
    function getActiveChildItem(items: Sidebar.SidebarItem[], path: string) {
      if (!items) return false
      for (const item of items) {
        if (matchPath(path, item.link)) return true
        if (item.link === path) return true
        if (!item.items) continue
        return getActiveChildItem(item.items, path)
      }
      return false
    }

    return getActiveChildItem(items, path)
  }, [items, path])

  React.useEffect(() => {
    if (hasActiveChildItem) setCollapsed(false)
  }, [hasActiveChildItem])

  const [collapsed, setCollapsed] = React.useState(() => {
    if (!items) return false
    if (hasActiveChildItem) return false
    return Boolean(props.collapsed)
  })

  const collapsable = typeof collapsed === 'boolean'
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
        {text ? (
          <div
            className="vocs:h-[2.5em] vocs:px-3 vocs:-mx-3 vocs:rounded-md vocs:flex vocs:items-center vocs:justify-between vocs:text-heading vocs:font-medium vocs:data-collapsable:cursor-pointer"
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
        ) : (
          <div className="vocs:h-[1em]" />
        )}

        {!collapsed && (
          <div>
            {items.length > 0 &&
              depth < 5 &&
              items.map((item, i) => (
                <SidebarItem key={`${item.text}${i}`} {...item} depth={depth + 1} />
              ))}
          </div>
        )}
      </section>
    )
  if (link)
    return (
      <Link
        className={SidebarItem.className({ link: true })}
        data-v-sidebar-item
        to={link}
        {...(active && { 'data-active': true })}
      >
        {text}
      </Link>
    )
  return (
    <div className={SidebarItem.className()} data-v-sidebar-item>
      {text}
    </div>
  )
}

export namespace SidebarItem {
  export type Props = Sidebar.SidebarItem & { depth?: number | undefined }

  export const className = cva(
    'vocs:flex vocs:-mx-3 vocs:px-3 vocs:text-primary/80 vocs:py-1.5 vocs:-my-0.5 vocs:items-center vocs:rounded-md vocs:data-active:bg-darkHover vocs:data-active:text-heading',
    {
      variants: {
        link: {
          true: 'vocs:hover:text-heading',
          undefined: 'vocs:cursor-default',
        },
      },
    },
  )
}
