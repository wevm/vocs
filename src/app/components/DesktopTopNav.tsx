import clsx from 'clsx'
import { type ComponentType } from 'react'
import { useLocation } from 'react-router-dom'

import type { ParsedSocialItem, ParsedTopNavItem } from '../../config.js'
import { useActiveNavIds } from '../hooks/useActiveNavIds.js'
import { useConfig } from '../hooks/useConfig.js'
import { useLayout } from '../hooks/useLayout.js'
import { useLocale } from '../hooks/useLocale.js'
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
import { Language } from './icons/Language.js'
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
              style={{
                alignItems: 'center',
                display: 'flex',
                height: '56px',
                marginTop: '4px',
              }}
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

        {config.defaultLocale?.label &&
          config.defaultLocale.lang &&
          config.locales &&
          Object.keys(config.locales).length > 0 && (
            <>
              <div className={styles.group}>
                <NavigationLocale />
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
  const { locale } = useLocale()
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
              href={`${locale ? `/${locale}` : ''}${item.link!}`}
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

// START
function NavigationLocale() {
  const config = useConfig()
  const { pathname } = useLocation()
  /**
   *
   * @param item
   * @param lang
   * @returns
   */
  const removeLocalePrefix = (item: ParsedTopNavItem, lang: string) => {
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
    <NavigationMenu.Root delayDuration={0}>
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
          <NavigationMenu.Content className={styles.content}>
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
// END

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
