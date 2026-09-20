'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { cx } from 'cva'
import * as React from 'react'
import { style, theme, variants } from 'zyzz/default'
import { Link } from './Link.js'
import { useConfig } from './useConfig.js'

namespace styles {
  export const button = variants({
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'lg',
      paddingInline: 5,
      paddingBlock: 'calc(0.25rem * 2.5)',
      fontSize: '15px',
      fontWeight: 'medium',
      textDecorationLine: 'none',
      transitionProperty:
        'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
    },
    variants: {
      variant: {
        default: {
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: theme.vars.color.gray['400'],
          backgroundColor: theme.vars.color.surface,
          color: theme.vars.color.foreground,
          selectors: {
            '&:hover': {
              '@media (hover: hover)': { backgroundColor: theme.vars.color.gray['100'] },
            },
          },
        },
        accent: {
          borderColor: 'transparent',
          backgroundColor: theme.vars.color.blue['700'],
          color: theme.vars.color.white,
          selectors: { '&:hover': { '@media (hover: hover)': { opacity: '90%' } } },
        },
      },
    },
    defaultVariants: { variant: 'default' },
  })

  export const root = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingInline: 6,
    paddingTop: 16,
    paddingBottom: 16,
    textAlign: 'center',
    '@media (width >= 48rem)': { paddingTop: 24 },
  })
  export const logo = style({
    fontSize: '5xl',
    lineHeight: 1,
    fontWeight: 'bold',
    letterSpacing: '-0.025em',
    color: theme.vars.color.foreground,
    '@media (width >= 48rem)': { fontSize: '6xl', lineHeight: 1 },
  })
  export const logo2 = style({
    height: 12,
    '@media (width >= 48rem)': { height: 14 },
  })
  export const logo3 = style({
    height: 12,
    '@media (width >= 48rem)': { height: 14 },
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'none',
      },
    },
  })
  export const logo4 = style({
    display: 'none',
    height: 12,
    '@media (width >= 48rem)': { height: 14 },
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'block',
      },
    },
  })
  export const tagline = style({
    lineHeight: 'calc(1.75 / 1.25)',
    maxWidth: '42rem',
    fontSize: 'xl',
    color: theme.vars.color.foreground,
    '@media (width >= 48rem)': { fontSize: '2xl', lineHeight: 'calc(2 / 1.5)' },
  })
  export const description = style({
    lineHeight: 'calc(1.5 / 1)',
    maxWidth: '36rem',
    fontSize: 'base',
    color: theme.vars.color.gray['900'],
    '@media (width >= 48rem)': { fontSize: 'lg', lineHeight: 'calc(1.75 / 1.125)' },
  })
  export const buttons = style({
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 3,
  })

  export const installPackage = style({ maxWidth: '24rem', minWidth: '300px' })
  export const installPackage2 = style({
    marginBottom: 2,
    display: 'flex',
    justifyContent: 'center',
    gap: 1,
  })
  export const installPackage3 = style({
    cursor: 'pointer',
    borderRadius: 'md',
    paddingInline: 3,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    fontWeight: 'medium',
    color: theme.vars.color.gray['900'],
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: `color-mix(in oklab, ${theme.vars.color.gray['100']} 50%, transparent)`,
          color: theme.vars.color.foreground,
        },
      },
      '&[data-active]': {
        backgroundColor: theme.vars.color.gray['100'],
        color: theme.vars.color.foreground,
      },
    },
  })
  export const installPackage4 = style({
    cursor: 'pointer',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingInline: 4,
    paddingBlock: 3,
    fontFamily: theme.vars.fontFamily.mono,
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: theme.vars.color.gray['900'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          borderColor: `color-mix(in oklab, ${theme.vars.color.blue['700']} 50%, transparent)`,
        },
      },
    },
  })
  export const installPackage5 = style({ color: theme.vars.color.blue['900'] })
  export const installPackage6 = style({ color: theme.vars.color.blue['900'] })
}

export function Root(props: Root.Props) {
  const { children, className } = props
  return <div className={cx(styles.root().className, className)}>{children}</div>
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

  if (!logoUrl) return <h1 className={cx(styles.logo().className, className)}>{title}</h1>

  if (typeof logoUrl === 'string')
    return <img alt={title} className={cx(styles.logo2().className, className)} src={logoUrl} />

  return (
    <>
      <img alt={title} className={cx(styles.logo3().className, className)} src={logoUrl.light} />
      <img alt={title} className={cx(styles.logo4().className, className)} src={logoUrl.dark} />
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
  return <p className={cx(styles.tagline().className, className)}>{children}</p>
}

export declare namespace Tagline {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Description(props: Description.Props) {
  const { children, className } = props
  return <p className={cx(styles.description().className, className)}>{children}</p>
}

export declare namespace Description {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Buttons(props: Buttons.Props) {
  const { children, className } = props
  return <div className={cx(styles.buttons().className, className)}>{children}</div>
}

export declare namespace Buttons {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Button(props: Button.Props) {
  const { children, href, variant, className } = props

  return (
    <Link to={href} {...styles.button({ variant, className })}>
      {children}
    </Link>
  )
}

export declare namespace Button {
  export type Props = {
    children: React.ReactNode
    href: string
    variant?: 'default' | 'accent' | undefined
    className?: string | undefined
  }
}

const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const
type PackageManager = (typeof packageManagers)[number]

export function InstallPackage(props: InstallPackage.Props) {
  const { name, type = 'install' } = props
  const [selected, setSelected] = React.useState<PackageManager>('npm')
  const [copied, setCopied] = React.useState(false)

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

  return (
    <BaseTabs.Root
      className={styles.installPackage().className}
      onValueChange={(value) => setSelected(value as PackageManager)}
      value={selected}
    >
      <BaseTabs.List className={styles.installPackage2().className}>
        {packageManagers.map((pm) => (
          <BaseTabs.Tab className={styles.installPackage3().className} key={pm} value={pm}>
            {pm}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {packageManagers.map((pm) => (
        <BaseTabs.Panel
          className={styles.installPackage4().className}
          key={pm}
          onClick={handleCopy}
          value={pm}
        >
          {copied ? (
            <span {...styles.installPackage5()}>Copied!</span>
          ) : (
            <>
              <span {...styles.installPackage6()}>{pm}</span> {getCommand(pm).replace(`${pm} `, '')}
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
