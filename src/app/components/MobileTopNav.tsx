import { TopNavEnd } from 'virtual:consumer-components'
import * as Accordion from '@radix-ui/react-accordion'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router'

import type * as Config from '../../config.js'
import { useActiveNavIds } from '../hooks/useActiveNavIds.js'
import { useConfig } from '../hooks/useConfig.js'
import { useLayout } from '../hooks/useLayout.js'
import { usePageData } from '../hooks/usePageData.js'
import { useSidebar } from '../hooks/useSidebar.js'
import { deserializeElement } from '../utils/deserializeElement.js'
import { Icon } from './Icon.js'
import { ChevronDown } from './icons/ChevronDown.js'
import { ChevronRight } from './icons/ChevronRight.js'
import { ChevronUp } from './icons/ChevronUp.js'
import { Menu } from './icons/Menu.js'
import { Link } from './Link.js'
import { MobileSearch } from './MobileSearch.js'
import * as styles from './MobileTopNav.css.js'
import * as NavigationMenu from './NavigationMenu.js'
import { NavLogo } from './NavLogo.js'
import { Outline } from './Outline.js'
import { Popover } from './Popover.js'
import { RouterLink } from './RouterLink.js'
import { Sidebar } from './Sidebar.js'
import { Socials } from './Socials.js'
import { ThemeToggle } from './ThemeToggle.js'

MobileTopNav.Curtain = Curtain

export function MobileTopNav() {
  const config = useConfig()
  const { showLogo } = useLayout()

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        {showLogo && (
          <div className={styles.group}>
            <div className={styles.logo}>
              <RouterLink to="/" style={{ alignItems: 'center', display: 'flex', height: '100%' }}>
                <NavLogo />
              </RouterLink>
            </div>
          </div>
        )}
        {config.topNav && (
          <div className={styles.group}>
            <Navigation items={config.topNav} />
            <CompactNavigation items={config.topNav} />
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.group} style={{ marginRight: '-8px' }}>
          <MobileSearch />
        </div>
      </div>
    </div>
  )
}

function Navigation({ items }: { items: Config.ParsedTopNavItem[] }) {
  const { pathname } = useLocation()
  const activeIds = useActiveNavIds({ pathname, items })
  return (
    <NavigationMenu.Root className={styles.navigation}>
      <NavigationMenu.List>
        {items.map((item, i) => {
          if (item.element) return deserializeElement(item.element)
          if (item.link) {
            return (
              <NavigationMenu.Link key={i} active={activeIds?.includes(item.id)} href={item.link!}>
                {item.text}
              </NavigationMenu.Link>
            )
          }
          return (
            <NavigationMenu.Item className={styles.item} key={i}>
              <NavigationMenu.Trigger active={activeIds?.includes(item.id)}>
                {item.text}
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className={styles.content}>
                <NavigationMenuContent items={item.items || []} />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          )
        })}
        <TopNavEnd />
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}

function NavigationMenuContent({ items }: { items: Config.ParsedTopNavItem[] }) {
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

function CompactNavigation({ items }: { items: Config.ParsedTopNavItem[] }) {
  const [showPopover, setShowPopover] = useState(false)

  const { showSidebar } = useLayout()

  const { pathname } = useLocation()
  const activeIds = useActiveNavIds({ pathname, items })
  const activeItem = items.filter((item) => item.id === activeIds[0])[0]

  const { basePath, theme } = useConfig()
  const assetBasePath = import.meta.env.PROD ? basePath : ''

  return (
    <div className={clsx(styles.navigation, styles.navigation_compact)}>
      <Popover.Root modal open={showPopover} onOpenChange={setShowPopover}>
        <Popover.Trigger className={clsx(styles.menuTrigger, styles.navigationItem)}>
          {showSidebar || activeItem ? (
            <>
              {activeItem?.text ?? 'Menu'}
              <Icon label="Menu" icon={ChevronDown} size="16px" />
            </>
          ) : (
            <Icon label="Menu" icon={Menu} size="16px" />
          )}
        </Popover.Trigger>
        <Popover className={styles.topNavPopover}>
          <Accordion.Root
            type="single"
            collapsible
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {items.map((item, i) => {
              if (item.element) return deserializeElement(item.element)
              if (item.link) {
                return (
                  <Link
                    key={i}
                    data-active={activeIds.includes(item.id)}
                    className={styles.navigationItem}
                    href={item.link!}
                    onClick={() => setShowPopover(false)}
                    variant="styleless"
                  >
                    {item.text}
                  </Link>
                )
              }
              return (
                <Accordion.Item key={i} value={i.toString()}>
                  <Accordion.Trigger
                    className={clsx(styles.navigationItem, styles.navigationTrigger)}
                    data-active={activeIds.includes(item.id)}
                    style={assignInlineVars({
                      [styles.chevronDownIcon]: `url(${assetBasePath}/.vocs/icons/chevron-down.svg)`,
                      [styles.chevronUpIcon]: `url(${assetBasePath}/.vocs/icons/chevron-up.svg)`,
                    })}
                  >
                    {item.text}
                  </Accordion.Trigger>
                  <Accordion.Content className={styles.navigationContent}>
                    {item.items?.map((item, i) => (
                      <Link
                        key={i}
                        className={styles.navigationItem}
                        href={item.link!}
                        onClick={() => setShowPopover(false)}
                        variant="styleless"
                      >
                        {item.text}
                      </Link>
                    ))}
                  </Accordion.Content>
                </Accordion.Item>
              )
            })}
            <TopNavEnd />
          </Accordion.Root>
          <div className={styles.topNavPopoverFooter}>
            <Socials />
            {!theme?.colorScheme ? <ThemeToggle /> : null}
          </div>
        </Popover>
      </Popover.Root>
    </div>
  )
}

export function Curtain({ enableScrollToTop }: { enableScrollToTop?: boolean }) {
  const { pathname } = useLocation()
  const { layout, showSidebar } = useLayout()
  const { frontmatter = {} } = usePageData()
  const sidebar = useSidebar()

  const [isOutlineOpen, setOutlineOpen] = useState(false)
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const sidebarItemTitle = useMemo(() => {
    if (!sidebar || layout === 'minimal') return
    const sidebarItem = getSidebarItemFromPathname({
      sidebarItems: sidebar.items,
      pathname,
    })
    return sidebarItem?.text
  }, [layout, pathname, sidebar])

  const contentTitle = useMemo(() => {
    if (typeof window === 'undefined') return
    return document.querySelector('.vocs_Content h1')?.textContent
  }, [])

  const title = sidebarItemTitle || frontmatter.title || contentTitle

  return (
    <div className={styles.curtain}>
      <div className={styles.curtainGroup}>
        <div className={styles.curtainItem}>
          {showSidebar ? (
            <Popover.Root modal open={isSidebarOpen} onOpenChange={setSidebarOpen}>
              <Popover.Trigger className={styles.menuTrigger}>
                <Icon label="Menu" icon={Menu} size="13px" />
                <div className={styles.menuTitle}>{title}</div>
              </Popover.Trigger>
              <Popover className={styles.sidebarPopover}>
                <Sidebar onClickItem={() => setSidebarOpen(false)} />
              </Popover>
            </Popover.Root>
          ) : (
            title
          )}
        </div>
      </div>
      <div className={styles.curtainGroup}>
        {enableScrollToTop && (
          <>
            <div className={styles.curtainItem}>
              <button
                className={styles.outlineTrigger}
                onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}
                type="button"
              >
                Top
                <Icon label="Scroll to top" icon={ChevronUp} size="16px" />
              </button>
            </div>
            <div className={styles.separator} />
          </>
        )}
        {layout === 'docs' && (
          <div className={styles.curtainItem}>
            <Popover.Root modal open={isOutlineOpen} onOpenChange={setOutlineOpen}>
              <Popover.Trigger className={styles.outlineTrigger}>
                On this page
                <Icon label="On this page" icon={ChevronRight} size="16px" />
              </Popover.Trigger>
              <Popover className={styles.outlinePopover}>
                <Outline onClickItem={() => setOutlineOpen(false)} showTitle={false} />
              </Popover>
            </Popover.Root>
          </div>
        )}
      </div>
    </div>
  )
}

function getSidebarItemFromPathname({
  sidebarItems,
  pathname: pathname_,
}: {
  sidebarItems: Config.SidebarItem[]
  pathname: string
}): Config.SidebarItem | undefined {
  const pathname = pathname_.replace(/(.+)\/$/, '$1')
  for (const item of sidebarItems) {
    if (item?.link === pathname) return item
    if (item.items) {
      const childItem = getSidebarItemFromPathname({ sidebarItems: item.items, pathname })
      if (childItem) return childItem
    }
  }
  return undefined
}
