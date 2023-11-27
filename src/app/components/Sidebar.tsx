import clsx from 'clsx'
import { type MouseEventHandler } from 'react'
import { Link, useMatch } from 'react-router-dom'

import { type SidebarItem as SidebarItemType } from '../../config.js'
import { useConfig } from '../hooks/useConfig.js'
import { Logo } from './Logo.js'
import * as styles from './Sidebar.css.js'

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

    if (!groups[lastGroupIndex]) {
      groups.push({ text: '', items: [item] })
    } else {
      groups[lastGroupIndex].items!.push(item)
    }
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

  if (item.items)
    return (
      <section className={clsx(styles.section, depth !== 0 && styles.level)}>
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
            <div className={clsx(depth === 0 ? styles.sectionTitle : styles.item)}>{item.text}</div>
          ))}

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
