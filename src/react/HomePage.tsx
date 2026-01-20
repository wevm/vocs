'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { cx } from 'cva'
import * as React from 'react'
import { Link } from './Link.js'
import { useConfig } from './useConfig.js'

export function Root(props: Root.Props) {
  const { children, className } = props
  return (
    <div
      className={cx(
        'vocs:flex vocs:flex-col vocs:items-center vocs:pt-16 vocs:md:pt-24 vocs:pb-16 vocs:px-6 vocs:text-center vocs:gap-8',
        className,
      )}
    >
      {children}
    </div>
  )
}

export declare namespace Root {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Logo(props: Logo.Props) {
  const { className } = props
  const { logoUrl, title } = useConfig()

  if (!logoUrl)
    return (
      <h1
        className={cx(
          'vocs:text-5xl vocs:md:text-6xl vocs:font-bold vocs:text-heading vocs:tracking-tight',
          className,
        )}
      >
        {title}
      </h1>
    )

  if (typeof logoUrl === 'string')
    return <img alt={title} className={cx('vocs:h-12 vocs:md:h-14', className)} src={logoUrl} />

  return (
    <>
      <img
        alt={title}
        className={cx('vocs:h-12 vocs:md:h-14 vocs:dark:hidden', className)}
        src={logoUrl.light}
      />
      <img
        alt={title}
        className={cx('vocs:h-12 vocs:md:h-14 vocs:hidden vocs:dark:block', className)}
        src={logoUrl.dark}
      />
    </>
  )
}

export declare namespace Logo {
  export type Props = {
    className?: string | undefined
  }
}

export function Tagline(props: Tagline.Props) {
  const { children, className } = props
  return (
    <p
      className={cx(
        'vocs:text-xl vocs:md:text-2xl vocs:text-primary vocs:max-w-2xl vocs:leading-relaxed',
        className,
      )}
    >
      {children}
    </p>
  )
}

export declare namespace Tagline {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Description(props: Description.Props) {
  const { children, className } = props
  return (
    <p
      className={cx(
        'vocs:text-base vocs:md:text-lg vocs:text-secondary vocs:max-w-xl vocs:leading-relaxed',
        className,
      )}
    >
      {children}
    </p>
  )
}

export declare namespace Description {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Buttons(props: Buttons.Props) {
  const { children, className } = props
  return (
    <div className={cx('vocs:flex vocs:flex-wrap vocs:justify-center vocs:gap-3', className)}>
      {children}
    </div>
  )
}

export declare namespace Buttons {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Button(props: Button.Props) {
  const { children, href, variant = 'secondary', className } = props

  const baseClasses =
    'vocs:inline-flex vocs:items-center vocs:justify-center vocs:px-5 vocs:py-2.5 vocs:rounded-lg vocs:text-[15px] vocs:font-medium vocs:transition-colors vocs:no-underline'

  const variantClasses =
    variant === 'accent'
      ? 'vocs:hover:opacity-90'
      : 'vocs:bg-surface vocs:border vocs:border-primary vocs:text-heading vocs:hover:bg-surfaceTint'

  const accentStyle =
    variant === 'accent'
      ? {
          backgroundColor: 'var(--vocs-text-color-heading)',
          color: 'var(--vocs-background-color-primary)',
        }
      : undefined

  return (
    <Link to={href} className={cx(baseClasses, variantClasses, className)} style={accentStyle}>
      {children}
    </Link>
  )
}

export declare namespace Button {
  export type Props = {
    children: React.ReactNode
    href: string
    variant?: 'accent' | 'secondary' | undefined
    className?: string | undefined
  }
}

const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const
type PackageManager = (typeof packageManagers)[number]

export function InstallPackage(props: InstallPackage.Props) {
  const { name, type = 'install' } = props
  const [selected, setSelected] = React.useState<PackageManager>('npm')
  const [hasMounted, setHasMounted] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const getCommand = (pm: PackageManager) => {
    if (type === 'init') {
      if (pm === 'npm') return `npm init ${name}`
      if (pm === 'pnpm') return `pnpm create ${name}`
      if (pm === 'yarn') return `yarn create ${name}`
      if (pm === 'bun') return `bun create ${name}`
    }
    if (pm === 'npm') return `npm install ${name}`
    if (pm === 'pnpm') return `pnpm add ${name}`
    if (pm === 'yarn') return `yarn add ${name}`
    if (pm === 'bun') return `bun add ${name}`
    return ''
  }

  const handleCopy = async () => {
    const command = getCommand(selected)
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!hasMounted) return null

  return (
    <BaseTabs.Root
      className="vocs:min-w-[300px] vocs:max-w-sm"
      onValueChange={(value) => setSelected(value as PackageManager)}
      value={selected}
    >
      <BaseTabs.List className="vocs:flex vocs:justify-center vocs:gap-1 vocs:mb-2">
        {packageManagers.map((pm) => (
          <BaseTabs.Tab
            className="vocs:px-3 vocs:py-1.5 vocs:text-sm vocs:font-medium vocs:text-secondary vocs:rounded-md vocs:transition-all vocs:duration-150 vocs:cursor-pointer vocs:hover:text-heading vocs:hover:bg-surfaceTint/50 vocs:data-active:bg-surfaceTint vocs:data-active:text-heading"
            key={pm}
            value={pm}
          >
            {pm}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {packageManagers.map((pm) => (
        <BaseTabs.Panel
          className="vocs:bg-surface vocs:border vocs:border-primary vocs:rounded-lg vocs:py-3 vocs:px-4 vocs:font-mono vocs:text-sm vocs:text-secondary vocs:cursor-pointer vocs:transition-colors vocs:hover:border-accent7/50"
          key={pm}
          onClick={handleCopy}
          value={pm}
        >
          {copied ? (
            <span className="vocs:text-accent7">Copied!</span>
          ) : (
            <>
              <span className="vocs:text-accent7">{pm}</span> {getCommand(pm).replace(`${pm} `, '')}
            </>
          )}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  )
}

export declare namespace InstallPackage {
  export type Props = {
    name: string
    type?: 'install' | 'init' | undefined
  }
}

export function CreatePackage(props: CreatePackage.Props) {
  return <InstallPackage {...props} type="init" />
}

export declare namespace CreatePackage {
  export type Props = {
    name: string
  }
}
