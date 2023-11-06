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

export function LowerTopNav({
  enableScrollToTop,
  MenuTrigger,
  OutlineTrigger,
}: {
  enableScrollToTop?: boolean
  MenuTrigger: React.ElementType
  OutlineTrigger: React.ElementType
}) {
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
      <div className={styles.lowerGroup}>
        <div className={styles.lowerItem}>
          <MenuTrigger className={styles.menuTrigger}>
            <Icon label="Menu" src="/.vocs/icons/menu.svg" size="13px" />
            {title}
          </MenuTrigger>
        </div>
      </div>
      <div className={styles.lowerGroup}>
        {enableScrollToTop && (
          <>
            <div className={styles.lowerItem}>
              <button
                className={styles.outlineTrigger}
                onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}
                type="button"
              >
                Top
                <Icon label="Scroll to top" src="/.vocs/icons/chevron-up.svg" size="10px" />
              </button>
            </div>
            <div className={styles.separator} />
          </>
        )}
        <div className={styles.lowerItem}>
          <OutlineTrigger className={styles.outlineTrigger}>
            On this page
            <Icon label="On this page" src="/.vocs/icons/chevron-right.svg" size="10px" />
          </OutlineTrigger>
        </div>
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
