import clsx from 'clsx'
import type { ReactNode } from 'react'

import { useConfig } from '../hooks/useConfig.js'
import { Button as Button_, type ButtonProps } from './Button.js'
import * as styles from './HomePage.css.js'
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
    <h1 className={clsx(className, styles.title)}>{title}</h1>
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

export function Button(props: ButtonProps) {
  return <Button_ {...props} className={clsx(styles.button, props.className)} />
}

type NoRepetition<U extends string, ResultT extends any[] = []> =
  | ResultT
  | {
      [k in U]: NoRepetition<Exclude<U, k>, [k, ...ResultT]>
    }[U]

export function InstallPackage({
  name,
  type = 'install',
  packageManager = ['npm', 'pnpm', 'yarn'],
}: {
  className?: string
  name: string
  type?: 'install' | 'init'
  packageManager?: NoRepetition<'npm' | 'pnpm' | 'yarn' | 'bun'>
}) {
  return (
    <Tabs.Root className={styles.tabs} defaultValue={packageManager[0]}>
      <Tabs.List className={styles.tabsList}>
        {packageManager.map((manager) => (
          <Tabs.Trigger key={manager} value={manager}>
            {manager}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {packageManager.map((manager) => (
        <Tabs.Content key={manager} value={manager} className={styles.tabsContent}>
          <span className={styles.packageManager}>{manager}</span>{' '}
          {type === 'init' ? 'create' : 'add'} {name}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
