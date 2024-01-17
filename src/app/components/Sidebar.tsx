import clsx from 'clsx'
import {
  type KeyboardEvent,
  type MouseEvent,
  type MouseEventHandler,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { matchPath, useLocation, useMatch } from 'react-router-dom'

import { type SidebarItem as SidebarItemType } from '../../config.js'
import { usePageData } from '../hooks/usePageData.js'
import { useSidebar } from '../hooks/useSidebar.js'
import { Icon } from './Icon.js'
import { NavLogo } from './NavLogo.js'
import { RouterLink } from './RouterLink.js'
import * as styles from './Sidebar.css.js'
import { ChevronRight } from './icons/ChevronRight.js'

export function Sidebar(props: {
  className?: string
  onClickItem?: MouseEventHandler<HTMLAnchorElement>
}) {
  const { className, onClickItem } = props

  const { previousPath } = usePageData()
  const sidebarRef = useRef<HTMLElement>(null)
  const sidebar = useSidebar()
  const [backPath, setBackPath] = useState<string>('/')

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!previousPath) return
    setBackPath(previousPath)
  }, [sidebar.key, sidebar.backLink])

  if (!sidebar) return null

  const groups = getSidebarGroups(sidebar.items)

  return (
    <aside ref={sidebarRef} key={sidebar.key} className={clsx(styles.root, className)}>
      <div className={styles.logoWrapper}>
        <div className={styles.logo}>
          <RouterLink to="/" style={{ alignItems: 'center', display: 'flex', height: '100%' }}>
            <NavLogo />
          </RouterLink>
        </div>
        <div className={styles.divider} />
      </div>

      <nav className={styles.navigation}>
        <div className={styles.group}>
          {sidebar.backLink && (
            <section className={styles.section}>
              <div className={styles.items}>
                <RouterLink className={clsx(styles.item, styles.backLink)} to={backPath}>
                  ←{' '}
                  {typeof history !== 'undefined' && history.state.key && backPath !== '/'
                    ? 'Back'
                    : 'Home'}
                </RouterLink>
              </div>
            </section>
          )}
          {groups.map((group, i) => (
            <SidebarItem
              key={`${group.text}${i}`}
              depth={0}
              item={group}
              onClick={onClickItem}
              sidebarRef={sidebarRef}
            />
          ))}
        </div>
      </nav>
    </aside>
  )
}

function getSidebarGroups(sidebar: SidebarItemType[]): SidebarItemType[] {
  const groups: SidebarItemType[] = []

  let lastGroupIndex = 0
  for (const item of sidebar) {
    if (item.items) {
      lastGroupIndex = groups.push(item)
      continue
    }

    if (!groups[lastGroupIndex]) groups.push({ text: '', items: [item] })
    else groups[lastGroupIndex].items!.push(item)
  }

  return groups
}

function getActiveChildItem(
  items: SidebarItemType[],
  pathname: string,
): SidebarItemType | undefined {
  return items.find((item) => {
    if (matchPath(pathname, item.link ?? '')) return true
    if (item.link === pathname) return true
    if (!item.items) return false
    return getActiveChildItem(item.items, pathname)
  })
}

function SidebarItem(props: {
  depth: number
  item: SidebarItemType
  onClick?: MouseEventHandler<HTMLAnchorElement>
  sidebarRef?: RefObject<HTMLElement>
}) {
  const { depth, item, onClick, sidebarRef } = props

  const itemRef = useRef<HTMLElement>(null)

  const { pathname } = useLocation()
  const match = useMatch(item.link ?? '')

  const hasActiveChildItem = useMemo(
    () => (item.items ? Boolean(getActiveChildItem(item.items, pathname)) : false),
    [item.items, pathname],
  )

  const [collapsed, setCollapsed] = useState(() => {
    if (match) return false
    if (!item.items) return false
    if (hasActiveChildItem) return false
    return Boolean(item.collapsed)
  })
  const isCollapsable = item.collapsed !== undefined && item.items !== undefined
  const onCollapseInteraction = useCallback(
    (event: KeyboardEvent | MouseEvent) => {
      if ('key' in event && event.key !== 'Enter') return
      if (item.link) return
      setCollapsed((x) => !x)
    },
    [item.link],
  )
  const onCollapseTriggerInteraction = useCallback(
    (event: KeyboardEvent | MouseEvent) => {
      if ('key' in event && event.key !== 'Enter') return
      if (!item.link) return
      setCollapsed((x) => !x)
    },
    [item.link],
  )

  const active = useRef(true)
  useEffect(() => {
    if (!active.current) return
    active.current = false

    const match = matchPath(pathname, item.link ?? '')
    if (!match) return

    requestAnimationFrame(() => {
      const offsetTop = itemRef.current?.offsetTop ?? 0
      const sidebarHeight = sidebarRef?.current?.clientHeight ?? 0
      if (offsetTop < sidebarHeight) return
      sidebarRef?.current?.scrollTo({ top: offsetTop - 100 })
    })
  }, [item, pathname, sidebarRef])

  if (item.items)
    return (
      <section
        ref={itemRef}
        className={clsx(
          styles.section,
          depth === 0 && item.text && styles.level,
          depth === 0 && item.text && collapsed && styles.levelCollapsed,
        )}
      >
        {item.text && (
          <div
            className={styles.sectionHeader}
            {...(isCollapsable && !item.link
              ? {
                  role: 'button',
                  tabIndex: 0,
                  onClick: onCollapseInteraction,
                  onKeyDown: onCollapseInteraction,
                }
              : {})}
          >
            {item.text &&
              (item.link ? (
                <RouterLink
                  data-active={Boolean(match)}
                  onClick={onClick}
                  className={clsx(
                    depth === 0 ? styles.sectionTitle : styles.item,
                    hasActiveChildItem && styles.sectionHeaderActive,
                  )}
                  to={item.link}
                >
                  {item.text}
                </RouterLink>
              ) : (
                <div className={clsx(depth === 0 ? styles.sectionTitle : styles.item)}>
                  {item.text}
                </div>
              ))}

            {isCollapsable && (
              <div
                role="button"
                tabIndex={0}
                onClick={onCollapseTriggerInteraction}
                onKeyDown={onCollapseTriggerInteraction}
              >
                <Icon
                  className={clsx(
                    styles.sectionCollapse,
                    collapsed && styles.sectionCollapseActive,
                  )}
                  label="toggle section"
                  icon={ChevronRight}
                  size="10px"
                />
              </div>
            )}
          </div>
        )}

        {!collapsed && (
          <div className={clsx(styles.items, depth !== 0 && styles.levelInset)}>
            {item.items &&
              item.items.length > 0 &&
              depth < 5 &&
              item.items.map((item, i) => (
                <SidebarItem
                  depth={depth + 1}
                  item={item}
                  key={`${item.text}${i}`}
                  onClick={onClick}
                  sidebarRef={sidebarRef}
                />
              ))}
          </div>
        )}
      </section>
    )

  return (
    <>
      {item.link ? (
        <RouterLink
          ref={itemRef}
          data-active={Boolean(match)}
          onClick={onClick}
          className={styles.item}
          to={item.link}
        >
          {item.text}
        </RouterLink>
      ) : (
        <div className={styles.item}>{item.text}</div>
      )}
    </>
  )
}
