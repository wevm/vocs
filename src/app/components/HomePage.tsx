import clsx from 'clsx'
import type { ReactNode } from 'react'

import { useConfig } from '../hooks/useConfig.js'
import * as styles from './HomePage.css.js'
import { Link } from './Link.js'
import { Logo as Logo_ } from './Logo.js'
import * as Tabs from './Tabs.js'

export type HomePageProps = {
  description?: ReactNode
  tagline?: ReactNode
}

export function Root({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(className, styles.root)}>{children}</div>
}

export function Logo({ className }: { className?: string }) {
  const { logoUrl, title } = useConfig()
  return logoUrl ? (
    <div className={clsx(className, styles.logo)}>
      <Logo_ />
    </div>
  ) : (
    <h1 className={clsx(className)}>{title}</h1>
  )
}

export function Tagline({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(className, styles.tagline)}>{children}</div>
}

export function Description({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(className, styles.description)}>{children}</div>
}

export function Buttons({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(className, styles.buttons)}>{children}</div>
}

export function Button({
  children,
  className,
  href,
  variant,
}: { children: ReactNode; className?: string; href?: string; variant: 'accent' }) {
  return (
    <Link
      className={clsx(className, styles.button, variant === 'accent' && styles.button_accent)}
      href={href}
      variant="styleless"
    >
      {children}
    </Link>
  )
}

export function InstallPackage({
  name,
  type = 'install',
}: { children: ReactNode; className?: string; name: string; type?: 'install' | 'init' }) {
  return (
    <Tabs.Root className={styles.tabs} defaultValue="npm">
      <Tabs.List className={styles.tabsList}>
        <Tabs.Trigger value="npm">npm</Tabs.Trigger>
        <Tabs.Trigger value="pnpm">pnpm</Tabs.Trigger>
        <Tabs.Trigger value="yarn">yarn</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content className={styles.tabsContent} value="npm">
        <span className={styles.packageManager}>npm</span> {type === 'init' ? 'init' : 'install'}{' '}
        {name}
      </Tabs.Content>
      <Tabs.Content className={styles.tabsContent} value="pnpm">
        <span className={styles.packageManager}>pnpm</span> {type === 'init' ? 'create' : 'install'}{' '}
        {name}
      </Tabs.Content>
      <Tabs.Content className={styles.tabsContent} value="yarn">
        <span className={styles.packageManager}>yarn</span> {type === 'init' ? 'create' : 'install'}{' '}
        {name}
      </Tabs.Content>
    </Tabs.Root>
  )
}
