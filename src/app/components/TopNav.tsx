import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { config } from 'virtual:config'

import type { Sidebar, SidebarItem } from '../../config.js'
import * as styles from './TopNav.css.js'
import { Menu } from './svgs/Menu.js'

export function UpperTopNav() {
  return (
    <div className={styles.upper}>
      <div className={styles.title}>Vocs</div>
    </div>
  )
}

export function LowerTopNav({ MenuTrigger }: { MenuTrigger: React.ElementType }) {
  const { pathname } = useLocation()
  const sidebarItem = useMemo(
    () =>
      config.sidebar
        ? getSidebarItemFromPathname({
            sidebar: config.sidebar,
            pathname,
          })
        : undefined,
    [pathname],
  )
  if (!sidebarItem) return null
  return (
    <div className={styles.lower}>
      <div className={styles.lowerLeft}>
        <MenuTrigger className={styles.menuTrigger}>
          <Menu width={14} height={14} />
          <div className={styles.breadcrumb}>{sidebarItem.title}</div>
        </MenuTrigger>
      </div>
    </div>
  )
}

function getSidebarItemFromPathname({
  sidebar,
  pathname: pathname_,
}: { sidebar: Sidebar; pathname: string }): SidebarItem {
  const pathname = pathname_.replace(/(.+)\/$/, '$1')
  return sidebar.find((item) => {
    if (item.path === pathname) return true
    if (item.children) return getSidebarItemFromPathname({ sidebar, pathname })
    return false
  }) as SidebarItem
}
