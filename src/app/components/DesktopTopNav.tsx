import clsx from 'clsx'
import { type ComponentType } from 'react'
import { Link as RRLink, matchPath, useLocation } from 'react-router-dom'

import type { ParsedSocialItem } from '../../config.js'
import { useConfig } from '../hooks/useConfig.js'
import { useTheme } from '../hooks/useTheme.js'
import { visibleDark, visibleLight } from '../styles/utils.css.js'
import * as styles from './DesktopTopNav.css.js'
import { Icon } from './Icon.js'
import { Link } from './Link.js'
import { Logo } from './Logo.js'
import { Discord } from './icons/Discord.js'
import { GitHub } from './icons/GitHub.js'
import { Moon } from './icons/Moon.js'
import { Sun } from './icons/Sun.js'
import { X } from './icons/X.js'

DesktopTopNav.Curtain = Curtain

export function DesktopTopNav() {
  const config = useConfig()
  return (
    <div className={styles.root}>
      <div className={styles.logoWrapper}>
        <div className={styles.logo}>
          <RRLink
            to="/"
            style={{ alignItems: 'center', display: 'flex', height: '56px', marginTop: '4px' }}
          >
            <Logo />
          </RRLink>
        </div>
      </div>
      <div className={styles.section} />
      <div className={styles.section}>
        {config.topNav && (
          <>
            <div className={styles.group}>
              <Navigation />
            </div>
            <div className={styles.divider} />
          </>
        )}
        {config.socials && (
          <>
            <div style={{ marginLeft: '-8px', marginRight: '-8px' }}>
              <div className={styles.group}>
                {config.socials.map((social, i) => (
                  <div className={styles.item} key={i}>
                    <SocialButton {...social} />
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.divider} />
          </>
        )}
        <div style={{ marginLeft: '-8px', marginRight: '-8px' }}>
          <div className={styles.group}>
            <div className={styles.item}>
              <ThemeToggleButton />
            </div>
          </div>
        </div>
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
  const activeItem = topNav
    .filter((item) => pathname.replace(/\.html$/, '').startsWith(item.link))
    .slice(-1)[0]

  return (
    <div className={styles.navigation}>
      {topNav.map((item) => (
        <Link
          key={item.link!}
          data-active={item.link === activeItem?.link}
          className={clsx(styles.item, styles.navigationItem)}
          href={item.link!}
          variant="styleless"
        >
          {item.title}
        </Link>
      ))}
    </div>
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
  x: X,
} satisfies Record<ParsedSocialItem['type'], ComponentType>

const sizesForType = {
  discord: '23px',
  github: '20px',
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
