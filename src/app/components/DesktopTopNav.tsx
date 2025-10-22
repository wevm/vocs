import { TopNavEnd } from 'virtual:consumer-components'
import clsx from 'clsx'
import { useLocation } from 'react-router'

import type { ParsedTopNavItem } from '../../config.js'
import { useActiveNavIds } from '../hooks/useActiveNavIds.js'
import { useConfig } from '../hooks/useConfig.js'
import { useLayout } from '../hooks/useLayout.js'
import { deserializeElement } from '../utils/deserializeElement.js'
import { DesktopSearch } from './DesktopSearch.js'
import * as styles from './DesktopTopNav.css.js'
import * as NavigationMenu from './NavigationMenu.js'
import { NavLogo } from './NavLogo.js'
import { RouterLink } from './RouterLink.js'

DesktopTopNav.Curtain = Curtain

export function DesktopTopNav() {
  const config = useConfig()
  const { showLogo, showSidebar } = useLayout()

  return (
    <div className={clsx(styles.root, showLogo && !showSidebar && styles.withLogo)}>
      <DesktopSearch />

      {showLogo && (
        <div className={styles.logoWrapper}>
          <div className={styles.logo}>
            <RouterLink
              to="/"
              style={{ alignItems: 'center', display: 'flex', height: '56px', marginTop: '4px' }}
            >
              <NavLogo />
            </RouterLink>
          </div>
        </div>
      )}

      <div className={styles.section} />

      <div className={styles.section}>
        {(config.topNav?.length || 0) > 0 && (
          <div className={styles.group}>
            <Navigation />
          </div>
        )}
      </div>
    </div>
  )
}

export function Curtain() {
  return <div className={styles.curtain} />
}

function Navigation() {
  const { topNav } = useConfig()
  const { pathname } = useLocation()
  const activeIds = useActiveNavIds({ pathname, items: topNav || [] })

  if (!topNav) return null
  return (
    <NavigationMenu.Root delayDuration={0}>
      <NavigationMenu.List>
        {topNav.map((item, i) => {
          if (item.element) return deserializeElement(item.element)
          if (item.link)
            return (
              <NavigationMenu.Link
                key={i}
                active={activeIds.includes(item.id)}
                className={styles.item}
                href={item.link!}
              >
                {item.text}
              </NavigationMenu.Link>
            )
          if (item.items)
            return (
              <NavigationMenu.Item key={i} className={styles.item}>
                <NavigationMenu.Trigger active={activeIds.includes(item.id)}>
                  {item.text}
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className={styles.content}>
                  <NavigationMenuContent items={item.items} />
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            )
          return null
        })}
        <TopNavEnd />
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}

function NavigationMenuContent({ items }: { items: ParsedTopNavItem[] }) {
  const { pathname } = useLocation()
  const activeIds = useActiveNavIds({ pathname, items })
  return (
    <ul>
      {items?.map((item, i) => (
        <NavigationMenu.Link key={i} active={activeIds.includes(item.id)} href={item.link!}>
          {item.text}
        </NavigationMenu.Link>
      ))}
    </ul>
  )
}
