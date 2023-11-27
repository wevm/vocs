import clsx from 'clsx'
import {
  type MouseEventHandler,
  type KeyboardEvent,
  useCallback,
  type MouseEvent,
  useState,
} from 'react'
import { Link, useMatch } from 'react-router-dom'

import { type SidebarItem as SidebarItemType } from '../../config.js'
import { useConfig } from '../hooks/useConfig.js'
import { Logo } from './Logo.js'
import * as styles from './Sidebar.css.js'
import { ChevronRight } from './icons/ChevronRight.js'
import { Icon } from './Icon.js'

export function Sidebar(props: {
  className?: string
  onClickItem?: MouseEventHandler<HTMLAnchorElement>
}) {
  const { className, onClickItem } = props

  const config = useConfig()
  const { sidebar } = config

  if (!sidebar) return null

  const groups = getSidebarGroups(sidebar)

  return (
    <aside className={clsx(styles.root, className)}>
      <div className={styles.logoWrapper}>
        <div className={styles.logo}>
          <Link to="/" style={{ alignItems: 'center', display: 'flex', height: '100%' }}>
            <Logo />
          </Link>
        </div>
        <div className={styles.divider} />
      </div>

      <nav className={styles.navigation}>
        <div className={styles.items}>
          {groups.map((group) => (
            <div className={styles.group} key={group.link ?? group.text}>
              <SidebarItem depth={0} item={group} onClick={onClickItem} />
            </div>
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

function SidebarItem(props: {
  depth: number
  item: SidebarItemType
  onClick?: MouseEventHandler<HTMLAnchorElement>
}) {
  const { depth, item, onClick } = props

  const match = useMatch(item.link ?? '')

  const [collapsed, setCollapsed] = useState(() => item.collapsed ?? false)
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

  if (item.items)
    return (
      <section
        className={clsx(
          styles.section,
          depth === 0 ? (collapsed ? styles.levelCollapsed : styles.level) : styles.levelInset,
        )}
      >
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
              <Link
                data-active={Boolean(match)}
                onClick={onClick}
                className={clsx(depth === 0 ? styles.sectionTitle : styles.item)}
                to={item.link}
              >
                {item.text}
              </Link>
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
                className={clsx(styles.sectionCollapse, collapsed && styles.sectionCollapseActive)}
                label="toggle section"
                icon={ChevronRight}
                size="10px"
              />
            </div>
          )}
        </div>

        <div className={styles.items} style={collapsed ? { display: 'none' } : {}}>
          {item.items &&
            item.items.length > 0 &&
            depth < 5 &&
            item.items.map((item) => (
              <SidebarItem
                depth={depth + 1}
                item={item}
                key={item.link ?? item.text}
                onClick={onClick}
              />
            ))}
        </div>
      </section>
    )

  return (
    <>
      {item.link ? (
        <Link data-active={Boolean(match)} onClick={onClick} className={styles.item} to={item.link}>
          {item.text}
        </Link>
      ) : (
        <div className={styles.item}>{item.text}</div>
      )}
    </>
  )
}
