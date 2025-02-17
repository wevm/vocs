import clsx from 'clsx'
import { useLocation } from 'react-router-dom'

import type { ParsedTopNavItem } from '../../config.js'
import { useActiveNavIds } from '../hooks/useActiveNavIds.js'
import { useConfig } from '../hooks/useConfig.js'
import { useLayout } from '../hooks/useLayout.js'
import { DesktopSearch } from './DesktopSearch.js'
import * as styles from './DesktopTopNav.css.js'
import { NavLogo } from './NavLogo.js'
import * as NavigationMenu from './NavigationMenu.js'
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
  if (!topNav) return null

  const { pathname } = useLocation()
  const activeIds = useActiveNavIds({ pathname, items: topNav })

  return (
    <NavigationMenu.Root delayDuration={0}>
      <NavigationMenu.List>
        {topNav.map((item, i) =>
          item.link ? (
            <NavigationMenu.Link
              key={i}
              active={activeIds.includes(item.id)}
              className={styles.item}
              href={item.link!}
            >
              {item.text}
            </NavigationMenu.Link>
          ) : item.items ? (
            <NavigationMenu.Item key={i} className={styles.item}>
              <NavigationMenu.Trigger active={activeIds.includes(item.id)}>
                {item.text}
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className={styles.content}>
                <NavigationMenuContent items={item.items} />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          ) : null,
        )}
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
