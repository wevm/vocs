import clsx from 'clsx'
import { type ComponentType } from 'react'
import { useLocation } from 'react-router-dom'

import type { ParsedSocialItem, ParsedTopNavItem } from '../../config.js'
import { useActiveNavIds } from '../hooks/useActiveNavIds.js'
import { useConfig } from '../hooks/useConfig.js'
import { useLayout } from '../hooks/useLayout.js'
import { useTheme } from '../hooks/useTheme.js'
import { visibleDark, visibleLight } from '../styles/utils.css.js'
import { DesktopSearch } from './DesktopSearch.js'
import * as styles from './DesktopTopNav.css.js'
import { Icon } from './Icon.js'
import { NavLogo } from './NavLogo.js'
import * as NavigationMenu from './NavigationMenu.js'
import { RouterLink } from './RouterLink.js'
import { Discord } from './icons/Discord.js'
import { GitHub } from './icons/GitHub.js'
import { Moon } from './icons/Moon.js'
import { Sun } from './icons/Sun.js'
import { Telegram } from './icons/Telegram.js'
import { X } from './icons/X.js'

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
          <>
            <div className={styles.group}>
              <Navigation />
            </div>
            <div className={clsx(styles.divider, styles.hideCompact)} />
          </>
        )}

        {config.socials && config.socials?.length > 0 && (
          <>
            <div
              className={clsx(styles.group, styles.hideCompact)}
              style={{ marginLeft: '-8px', marginRight: '-8px' }}
            >
              {config.socials.map((social, i) => (
                <div className={styles.item} key={i}>
                  <SocialButton {...social} />
                </div>
              ))}
            </div>
            {!config.theme?.colorScheme && (
              <div className={clsx(styles.divider, styles.hideCompact)} />
            )}
          </>
        )}

        {!config.theme?.colorScheme && (
          <div
            className={clsx(styles.group, styles.hideCompact)}
            style={{ marginLeft: '-8px', marginRight: '-8px' }}
          >
            <div className={styles.item}>
              <ThemeToggleButton />
            </div>
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

function ThemeToggleButton() {
  const { toggle } = useTheme()
  return (
    <button className={styles.button} onClick={toggle} type="button">
      <Icon className={clsx(styles.icon, visibleDark)} size="20px" label="Light" icon={Sun} />
      <Icon
        className={clsx(styles.icon, visibleLight)}
        size="20px"
        label="Dark"
        icon={Moon}
        style={{ marginTop: '-2px' }}
      />
    </button>
  )
}

const iconsForIcon = {
  discord: Discord,
  github: GitHub,
  telegram: Telegram,
  x: X,
} satisfies Record<ParsedSocialItem['type'], ComponentType>

const sizesForType = {
  discord: '23px',
  github: '20px',
  telegram: '21px',
  x: '18px',
} satisfies Record<ParsedSocialItem['type'], string>

function SocialButton({ icon, label, link }: ParsedSocialItem) {
  return (
    <a className={styles.button} href={link} target="_blank" rel="noopener noreferrer">
      <Icon
        className={styles.icon}
        label={label}
        icon={iconsForIcon[icon]}
        size={sizesForType[icon] || '20px'}
      />
    </a>
  )
}
