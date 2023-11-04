import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { config } from 'virtual:config'

import type { Sidebar, SidebarItem } from '../../config.js'
import { Icon } from './Icon.js'
import * as styles from './TopNav.css.js'

export function UpperTopNav() {
  return (
    <div className={styles.upper}>
      <div className={styles.title}>Vocs</div>
    </div>
  )
}

export function LowerTopNav({ MenuTrigger }: { MenuTrigger: React.ElementType }) {
  const { pathname } = useLocation()

  const sidebarItemTitle = useMemo(() => {
    if (!config.sidebar) return
    const sidebarItem = getSidebarItemFromPathname({
      sidebar: config.sidebar,
      pathname,
    })
    return sidebarItem?.title
  }, [pathname])

  const contentTitle = useMemo(() => {
    if (typeof window === 'undefined') return
    return document.querySelector('.vocs_Content h1')?.textContent
  }, [])

  const title = sidebarItemTitle || contentTitle

  return (
    <div className={styles.lower}>
      <div className={styles.lowerLeft}>
        <MenuTrigger className={styles.menuTrigger}>
          <Icon label="Menu" src="/.vocs/icons/menu.svg" size="14px" />
          <div className={styles.breadcrumb}>{title}</div>
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
