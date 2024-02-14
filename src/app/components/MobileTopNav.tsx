import * as Accordion from '@radix-ui/react-accordion'
import clsx from 'clsx'
import { type ComponentType, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import type * as Config from '../../config.js'
import { useActiveNavIds } from '../hooks/useActiveNavIds.js'
import { useConfig } from '../hooks/useConfig.js'
import { useLayout } from '../hooks/useLayout.js'
import { usePageData } from '../hooks/usePageData.js'
import { useSidebar } from '../hooks/useSidebar.js'
import { Icon } from './Icon.js'
import { Link } from './Link.js'
import { MobileSearch } from './MobileSearch.js'
import * as styles from './MobileTopNav.css.js'
import { NavLogo } from './NavLogo.js'
import * as NavigationMenu from './NavigationMenu.js'
import { Outline } from './Outline.js'
import { Popover } from './Popover.js'
import { RouterLink } from './RouterLink.js'
import { Sidebar } from './Sidebar.js'
import { ChevronDown } from './icons/ChevronDown.js'
import { ChevronRight } from './icons/ChevronRight.js'
import { ChevronUp } from './icons/ChevronUp.js'
import { Discord } from './icons/Discord.js'
import { GitHub } from './icons/GitHub.js'
import { Language } from './icons/Language.js'
import { Menu } from './icons/Menu.js'
import { Telegram } from './icons/Telegram.js'
import { X } from './icons/X.js'

MobileTopNav.Curtain = Curtain

export function MobileTopNav() {
  const config = useConfig()
  const { pathname } = useLocation()
  const { showLogo } = useLayout()

  let pathKey = ''
  if (typeof config.topNav === 'object' && Object.keys(config.topNav ?? {}).length > 0) {
    let keys: string[] = []
    keys = Object.keys(config.topNav).filter((key) => pathname.startsWith(key))
    pathKey = keys[keys.length - 1]
  }
  const configTopNav = Array.isArray(config.topNav) ? config.topNav : config?.topNav?.[pathKey]

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
        {configTopNav && (
          <>
            <div className={styles.group}>
              <Navigation items={configTopNav} />
              <CompactNavigation items={configTopNav} />
            </div>
          </>
        )}
      </div>

      <div className={styles.section}>
        {config.defaultLocale?.label &&
          config.defaultLocale.lang &&
          config.locales &&
          Object.keys(config.locales).length > 0 && (
            <>
              <div className={styles.group}>
                <NavigationLocale />
                <CompactNavigationLocale />
              </div>
            </>
          )}
        <div className={styles.group} style={{ marginRight: '-8px' }}>
          <MobileSearch />
        </div>
        {config.socials && config.socials?.length > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.group} style={{ marginLeft: '-8px' }}>
              {config.socials?.map((social, i) => (
                <SocialButton key={i} {...social} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function NavigationLocale() {
  const config = useConfig()
  const { pathname } = useLocation()
  /**
   *
   * @param item
   * @param lang
   * @returns
   */
  const removeLocalePrefix = (item: Config.ParsedTopNavItem, lang: string) => {
    // Get all language prefixes
    const prefixLocales = [
      config?.defaultLocale?.lang,
      ...Object.keys(config?.locales ?? {}).map((i) =>
        config?.locales ? config.locales[i]?.lang : null,
      ),
    ]
    // Regex for removal
    const regexString = `^\/(${prefixLocales.join('|')})`
    const regex = new RegExp(regexString)
    return {
      ...item,
      link: `${lang ? `/${lang}` : ''}${item.link?.replace(regex, '') ?? ''}`,
    }
  }

  if (!(config.locales || (config.locales && Object.keys(config.locales).length === 0))) return null
  return (
    <NavigationMenu.Root delayDuration={0} className={styles.navigation}>
      <NavigationMenu.List>
        <NavigationMenu.Item className={styles.item}>
          <NavigationMenu.Trigger active={false}>
            <Icon
              className={clsx(styles.icon)}
              size="20px"
              label="Language"
              icon={() => <Language />}
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content id="hello" className={styles.contentRight}>
            <NavigationMenuContent
              items={[
                ...(config?.defaultLocale?.label && config?.defaultLocale?.lang
                  ? [
                      removeLocalePrefix(
                        {
                          id: 0,
                          text: `${config?.defaultLocale?.label}`,
                          link: `${pathname}`,
                        },
                        '',
                      ),
                    ]
                  : []),
                ...Object.keys(config.locales).map((locale, key) => {
                  return removeLocalePrefix(
                    {
                      id: key + (config?.defaultLocale?.label ? 1 : 0),
                      text: `${config.locales?.[locale].label}`,
                      link: `${pathname}`,
                    },
                    `${config.locales?.[locale].lang}`,
                  )
                }),
              ]}
            />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}

function Navigation({ items }: { items: Config.ParsedTopNavItem[] }) {
  const { pathname } = useLocation()
  const activeIds = useActiveNavIds({ pathname, items })
  return (
    <NavigationMenu.Root className={styles.navigation}>
      <NavigationMenu.List>
        {items.map((item, i) =>
          item?.link ? (
            <NavigationMenu.Link key={i} active={activeIds?.includes(item.id)} href={item.link!}>
              {item.text}
            </NavigationMenu.Link>
          ) : (
            <NavigationMenu.Item className={styles.item} key={i}>
              <NavigationMenu.Trigger active={activeIds?.includes(item.id)}>
                {item.text}
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className={styles.contentLeft}>
                <NavigationMenuContent items={item.items || []} />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          ),
        )}
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

function CompactNavigationLocale() {
  const config = useConfig()
  const { pathname } = useLocation()

  /**
   *
   * @param item
   * @param lang
   * @returns
   */
  const removeLocalePrefix = (item: Config.ParsedTopNavItem, lang: string) => {
    // Get all language prefixes
    const prefixLocales = [
      config?.defaultLocale?.lang,
      ...Object.keys(config?.locales ?? {}).map((i) =>
        config?.locales ? config.locales[i]?.lang : null,
      ),
    ]
    // Regex for removal
    const regexString = `^\/(${prefixLocales.join('|')})`
    const regex = new RegExp(regexString)
    return {
      ...item,
      link: `${lang ? `/${lang}` : ''}${item.link?.replace(regex, '') ?? ''}`,
    }
  }

  const items = [
    ...(config?.defaultLocale?.label && config?.defaultLocale?.lang
      ? [
          removeLocalePrefix(
            {
              id: 0,
              text: `${config?.defaultLocale?.label}`,
              link: `${pathname}`,
            },
            '',
          ),
        ]
      : []),
    ...Object.keys(config?.locales ?? {}).map((locale, key) => {
      return removeLocalePrefix(
        {
          id: key + (config?.defaultLocale?.label ? 1 : 0),
          text: `${config.locales?.[locale].label}`,
          link: `${pathname}`,
        },
        `${config.locales?.[locale].lang}`,
      )
    }),
  ]
  const [showPopover, setShowPopover] = useState(false)
  const activeIds = useActiveNavIds({ pathname, items })
  const activeItem = items.filter((item) => item.id === activeIds[0])[0]

  return (
    <div className={clsx(styles.navigation, styles.navigation_compact)}>
      {activeItem ? (
        <Popover.Root modal open={showPopover} onOpenChange={setShowPopover}>
          <Popover.Trigger className={clsx(styles.menuTrigger, styles.navigationItem)}>
            <Icon
              className={clsx(styles.icon)}
              size="20px"
              label="Language"
              icon={() => <Language />}
            />
            <Icon label="Menu" icon={ChevronDown} size="11px" />
          </Popover.Trigger>
          <Popover className={styles.topNavPopover}>
            <Accordion.Root
              type="single"
              collapsible
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {items.map((item, i) => (
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
              ))}
            </Accordion.Root>
          </Popover>
        </Popover.Root>
      ) : items[0]?.link ? (
        <Link className={styles.navigationItem} href={items[0].link} variant="styleless">
          {items[0].text}
        </Link>
      ) : null}
    </div>
  )
}

function CompactNavigation({ items }: { items: Config.ParsedTopNavItem[] }) {
  const [showPopover, setShowPopover] = useState(false)

  const { pathname } = useLocation()
  const activeIds = useActiveNavIds({ pathname, items })
  const activeItem = items.filter((item) => item.id === activeIds[0])[0]

  return (
    <div className={clsx(styles.navigation, styles.navigation_compact)}>
      {activeItem ? (
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
                item?.link ? (
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
                ) : (
                  <Accordion.Item key={i} value={i.toString()}>
                    <Accordion.Trigger
                      className={clsx(styles.navigationItem, styles.navigationTrigger)}
                      data-active={activeIds.includes(item.id)}
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
                ),
              )}
            </Accordion.Root>
          </Popover>
        </Popover.Root>
      ) : items[0]?.link ? (
        <Link className={styles.navigationItem} href={items[0].link} variant="styleless">
          {items[0].text}
        </Link>
      ) : null}
    </div>
  )
}

const iconsForIcon = {
  discord: Discord,
  github: GitHub,
  telegram: Telegram,
  x: X,
} satisfies Record<Config.ParsedSocialItem['type'], ComponentType>

const sizesForTypes = {
  discord: '21px',
  github: '18px',
  telegram: '21px',
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
                <Icon label="Scroll to top" icon={ChevronUp} size="10px" />
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
  sidebarItems,
  pathname: pathname_,
}: { sidebarItems: Config.SidebarItem[]; pathname: string }): Config.SidebarItem | undefined {
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
