import type { MouseEventHandler, ReactNode } from 'react'
import { Link, useMatch } from 'react-router-dom'
import { config } from 'virtual:config'

import * as styles from './Sidebar.css.js'

export function Sidebar({ onClickItem }: { onClickItem?: MouseEventHandler<HTMLAnchorElement> }) {
  const { sidebar } = config

  if (!sidebar) return null
  return (
    <aside className={styles.root}>
      <div className={styles.title}>Vocs</div>
      <nav>
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
