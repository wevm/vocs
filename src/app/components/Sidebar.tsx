import clsx from 'clsx'
import type { ComponentType, MouseEventHandler, ReactNode } from 'react'
import { Link, useMatch } from 'react-router-dom'
import { config } from 'virtual:config'

import type { ParsedSocialItem } from '../../config.js'
import { Icon } from './Icon.js'
import * as styles from './Sidebar.css.js'
import { Discord } from './icons/Discord.js'
import { GitHub } from './icons/GitHub.js'
import { X } from './icons/X.js'

export function Sidebar({ onClickItem }: { onClickItem?: MouseEventHandler<HTMLAnchorElement> }) {
  const { sidebar } = config

  if (!sidebar) return null
  return (
    <aside className={styles.root}>
      <div className={styles.logo}>
        {config.logoUrl ? (
          <>
            {typeof config.logoUrl === 'string' ? (
              <img alt="Logo" className={styles.logoImage} src={config.logoUrl} />
            ) : (
              <>
                <img
                  alt="Logo"
                  className={clsx(styles.logoImage, styles.logoDark)}
                  src={config.logoUrl.dark}
                />
                <img
                  alt="Logo"
                  className={clsx(styles.logoImage, styles.logoLight)}
                  src={config.logoUrl.light}
                />
              </>
            )}
          </>
        ) : (
          <div className={styles.title}>{config.title}</div>
        )}
      </div>
      <nav className={styles.navigation}>
        <section className={styles.section}>
          {/* <span className={styles.sectionTitle}>Introduction</span> */}
          <div className={styles.items}>
            {sidebar.map((item) => (
              <SidebarItem key={item.path!} onClick={onClickItem} path={item.path!}>
                {item.title}
              </SidebarItem>
            ))}
          </div>
        </section>
      </nav>
      {config.socials && (
        <>
          <div className={styles.socials}>
            {config.socials.map((item) => (
              <SocialLink key={item.link} {...item} />
            ))}
          </div>
        </>
      )}
    </aside>
  )
}

function SidebarItem({
  children,
  onClick,
  path,
}: { children: ReactNode; onClick?: MouseEventHandler<HTMLAnchorElement>; path: string }) {
  const match = useMatch(path)
  return (
    <Link data-active={Boolean(match)} onClick={onClick} className={styles.item} to={path!}>
      {children}
    </Link>
  )
}

const iconsForIcon = {
  discord: Discord,
  github: GitHub,
  x: X,
} satisfies Record<ParsedSocialItem['type'], ComponentType>

const sizesForTypes = {
  discord: '16px',
  github: '16px',
  x: '14px',
} satisfies Record<ParsedSocialItem['type'], string>

function SocialLink({ label, icon, link, type }: ParsedSocialItem) {
  return (
    <a className={styles.socialLink} href={link} rel="noopener noreferrer" target="_blank">
      <div className={styles.socialLinkIcon}>
        <Icon label={label} icon={iconsForIcon[icon]} size={sizesForTypes[type]} />
      </div>{' '}
      {label}
    </a>
  )
}
