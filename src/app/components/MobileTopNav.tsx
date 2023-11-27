import * as Accordion from '@radix-ui/react-accordion'
import clsx from 'clsx'
import { type ComponentType, useMemo, useState } from 'react'
import { Link as RRLink, useLocation } from 'react-router-dom'

import type * as Config from '../../config.js'
import { useConfig } from '../hooks/useConfig.js'
import { usePageData } from '../hooks/usePageData.js'
import { Icon } from './Icon.js'
import { Link } from './Link.js'
import * as styles from './MobileTopNav.css.js'
import { NavLogo } from './NavLogo.js'
import * as NavigationMenu from './NavigationMenu.js'
import { Outline } from './Outline.js'
import { Popover } from './Popover.js'
import { Sidebar } from './Sidebar.js'
import { ChevronDown } from './icons/ChevronDown.js'
import { ChevronRight } from './icons/ChevronRight.js'
import { ChevronUp } from './icons/ChevronUp.js'
import { Discord } from './icons/Discord.js'
import { GitHub } from './icons/GitHub.js'
import { Menu } from './icons/Menu.js'
import { X } from './icons/X.js'

MobileTopNav.Curtain = Curtain

export function MobileTopNav() {
  const { frontmatter = {} } = usePageData()
  const config = useConfig()

  const { pathname } = useLocation()
  const activeItem = config?.topNav
    ?.filter((item) => (item.link ? pathname.replace(/\.html$/, '').startsWith(item.link) : false))
    .slice(-1)[0]

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        {(frontmatter.logo || !('logo' in frontmatter)) && (
          <div className={styles.logo}>
            <RRLink to="/" style={{ alignItems: 'center', display: 'flex', height: '100%' }}>
              <NavLogo />
            </RRLink>
          </div>
        )}
      </div>
      <div className={styles.section}>
        {config.topNav && activeItem && (
          <>
            <div className={clsx(styles.group)}>
              <Navigation activeItem={activeItem} items={config.topNav} />
              {activeItem && <CompactNavigation activeItem={activeItem} items={config.topNav} />}
              <div className={styles.divider} />
            </div>
          </>
        )}
        <div className={styles.group}>
          {config.socials?.map((social, i) => (
            <SocialButton key={i} {...social} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Navigation({
  activeItem,
  items,
}: { activeItem?: Config.TopNavItem; items: Config.TopNavItem[] }) {
  return (
    <NavigationMenu.Root className={styles.navigation}>
      <NavigationMenu.List>
        {items.map((item, i) =>
          item.link ? (
            <NavigationMenu.Link key={i} active={item.link === activeItem?.link} href={item.link!}>
              {item.text}
            </NavigationMenu.Link>
          ) : (
            <NavigationMenu.Item key={i}>
              <NavigationMenu.Trigger>{item.text}</NavigationMenu.Trigger>
              <NavigationMenu.Content>
                <ul>
                  {item.children?.map((child, i) => (
                    <NavigationMenu.Link key={i} href={child.link!}>
                      {child.text}
                    </NavigationMenu.Link>
                  ))}
                </ul>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          ),
        )}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}

function CompactNavigation({
  activeItem,
  items,
}: { activeItem: Config.TopNavItem; items: Config.TopNavItem[] }) {
  const [showPopover, setShowPopover] = useState(false)

  return (
    <div className={clsx(styles.navigation, styles.navigation_compact)}>
      <Popover.Root modal open={showPopover} onOpenChange={setShowPopover}>
        <Popover.Trigger className={clsx(styles.menuTrigger, styles.navigationItem)}>
          {activeItem.text}
          <Icon label="Menu" icon={ChevronDown} size="11px" />
        </Popover.Trigger>
        <Popover className={styles.topNavPopover}>
          <Accordion.Root
            type="single"
            collapsible
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {items.map((item, i) =>
              item.link ? (
                <Link
                  key={i}
                  data-active={item.link === activeItem?.link}
                  className={styles.navigationItem}
                  href={item.link!}
                  onClick={() => setShowPopover(false)}
                  variant="styleless"
                >
                  {item.text}
                </Link>
              ) : (
                <Accordion.Item key={i} value="item">
                  <Accordion.Trigger
                    className={clsx(styles.navigationItem, styles.navigationTrigger)}
                  >
                    {item.text}
                  </Accordion.Trigger>
                  <Accordion.Content className={styles.navigationContent}>
                    {item.children?.map((child, i) => (
                      <Link
                        key={i}
                        className={styles.navigationItem}
                        href={child.link!}
                        onClick={() => setShowPopover(false)}
                        variant="styleless"
                      >
                        {child.text}
                      </Link>
                    ))}
                  </Accordion.Content>
                </Accordion.Item>
              ),
            )}
          </Accordion.Root>
        </Popover>
      </Popover.Root>
    </div>
  )
}

const iconsForIcon = {
  discord: Discord,
  github: GitHub,
  x: X,
} satisfies Record<Config.ParsedSocialItem['type'], ComponentType>

const sizesForTypes = {
  discord: '21px',
  github: '18px',
  x: '16px',
} satisfies Record<Config.ParsedSocialItem['type'], string>

function SocialButton({ icon, label, link, type }: Config.ParsedSocialItem) {
  return (
    <a className={styles.button} href={link} target="_blank" rel="noopener noreferrer">
      <Icon
        className={styles.icon}
        label={label}
        icon={iconsForIcon[icon]}
        size={sizesForTypes[type] || '18px'}
      />
    </a>
  )
}

export function Curtain({
  enableScrollToTop,
}: {
  enableScrollToTop?: boolean
}) {
  const config = useConfig()
  const { frontmatter = {} } = usePageData()
  const { pathname } = useLocation()

  const [isOutlineOpen, setOutlineOpen] = useState(false)
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const sidebarItemTitle = useMemo(() => {
    if (!config.sidebar || frontmatter.layout === 'minimal') return
    const sidebarItem = getSidebarItemFromPathname({
      sidebar: config.sidebar,
      pathname,
    })
    return sidebarItem?.text
  }, [config, frontmatter, pathname])

  const contentTitle = useMemo(() => {
    if (typeof window === 'undefined') return
    return document.querySelector('.vocs_Content h1')?.textContent
  }, [])

  const title = sidebarItemTitle || frontmatter.title || contentTitle

  return (
    <div className={styles.curtain}>
      <div className={styles.curtainGroup}>
        <div className={styles.curtainItem}>
          {frontmatter.layout === 'minimal' ? (
            title
          ) : (
            <Popover.Root modal open={isSidebarOpen} onOpenChange={setSidebarOpen}>
              <Popover.Trigger className={styles.menuTrigger}>
                <Icon label="Menu" icon={Menu} size="13px" />
                {title}
              </Popover.Trigger>
              <Popover className={styles.sidebarPopover}>
                <Sidebar onClickItem={() => setSidebarOpen(false)} />
              </Popover>
            </Popover.Root>
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
                <Icon label="Scroll to top" icon={ChevronUp} size="10px" />
              </button>
            </div>
            <div className={styles.separator} />
          </>
        )}
        {frontmatter.layout !== 'minimal' && (
          <div className={styles.curtainItem}>
            <Popover.Root modal open={isOutlineOpen} onOpenChange={setOutlineOpen}>
              <Popover.Trigger className={styles.outlineTrigger}>
                On this page
                <Icon label="On this page" icon={ChevronRight} size="10px" />
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
  sidebar,
  pathname: pathname_,
}: { sidebar: Config.Sidebar; pathname: string }): Config.SidebarItem | undefined {
  const pathname = pathname_.replace(/(.+)\/$/, '$1')
  for (const item of sidebar) {
    if (item.link === pathname) return item
    if (item.items) {
      const childItem = getSidebarItemFromPathname({ sidebar: item.items, pathname })
      if (childItem) return childItem
    }
  }
  return undefined
}
