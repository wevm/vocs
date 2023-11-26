import clsx from 'clsx'
import type { ComponentType, MouseEventHandler, ReactNode } from 'react'
import { Link, useMatch } from 'react-router-dom'

import type { ParsedSocialItem } from '../../config.js'
import { useConfig } from '../hooks/useConfig.js'
import { Icon } from './Icon.js'
import { Logo } from './Logo.js'
import * as styles from './Sidebar.css.js'
import { Discord } from './icons/Discord.js'
import { GitHub } from './icons/GitHub.js'
import { X } from './icons/X.js'

export function Sidebar({
  className,
  onClickItem,
}: { className?: string; onClickItem?: MouseEventHandler<HTMLAnchorElement> }) {
  const config = useConfig()
  const { sidebar } = config

  if (!sidebar) return null
  return (
    <aside className={clsx(styles.root, className)}>
      <div className={styles.logoWrapper}>
        <div className={styles.logo}>
          <Link to="/" style={{ alignItems: 'center', display: 'flex', height: '100%' }}>
            <Logo />
          </Link>
        </div>
        <div className={styles.divider} />
      </div>
      <nav className={styles.navigation}>
        <section className={styles.section}>
          {/* <span className={styles.sectionTitle}>Introduction</span> */}
          <div className={styles.items}>
            {sidebar.map((item) => (
              <SidebarItem key={item.link!} onClick={onClickItem} path={item.link!}>
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
