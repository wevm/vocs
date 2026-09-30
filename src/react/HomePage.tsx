'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import * as React from 'react'
import { cx } from 'zyzz'
import { style, vars } from '../styles/zyzz.config.js'
import { Link } from './Link.js'
import { useConfig } from './useConfig.js'

namespace styles {
  export const root = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8',
    paddingInline: '6',
    paddingTop: '16',
    paddingBottom: '16',
    textAlign: 'center',
    '@media (width >= 748px)': {
      paddingTop: '24',
    },
  })

  export const title = style({
    fontSize: '5xl',
    lineHeight: '5xl',
    fontWeight: 'bold',
    letterSpacing: 'tight',
    color: 'heading',
    '@media (width >= 748px)': {
      fontSize: '6xl',
      lineHeight: '6xl',
    },
  })

  export const logo = style({
    height: '12',
    '@media (width >= 748px)': {
      height: '14',
    },
  })

  export const lightLogo = style({
    height: '12',
    '@media (width >= 748px)': {
      height: '14',
    },
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'none',
      },
    },
  })

  export const darkLogo = style({
    display: 'none',
    height: '12',
    '@media (width >= 748px)': {
      height: '14',
    },
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'block',
      },
    },
  })

  export const tagline = style({
    maxWidth: '2xl',
    fontSize: 'xl',
    lineHeight: 'xl',
    color: 'primary',
    '@media (width >= 748px)': {
      fontSize: '2xl',
      lineHeight: '2xl',
    },
  })

  export const description = style({
    maxWidth: 'xl',
    fontSize: 'base',
    lineHeight: 'base',
    color: 'secondary',
    '@media (width >= 748px)': {
      fontSize: 'lg',
      lineHeight: 'lg',
    },
  })

  export const actions = style({
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '3',
  })

  export const button = style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'lg',
    paddingInline: '5',
    paddingBlock: 'twoAndHalf',
    fontSize: '15px !custom',
    fontWeight: 'medium',
    textDecorationLine: 'none',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
  })

  export const defaultButton = style({
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    color: 'heading',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceTint',
        },
      },
    },
  })

  export const accentButton = style({
    borderColor: 'transparent !custom',
    backgroundColor: 'accent',
    color: 'accentInvert',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          opacity: '90%',
        },
      },
    },
  })

  export const installPackage = style({
    maxWidth: 'sm',
    minWidth: '300px !custom',
  })

  export const packageManagers = style({
    marginBottom: '2',
    display: 'flex',
    justifyContent: 'center',
    gap: '1',
  })

  export const packageManager = style({
    cursor: 'pointer',
    borderRadius: 'md',
    paddingInline: '3',
    paddingBlock: 'oneAndHalf',
    fontSize: 'sm',
    lineHeight: 'sm',
    fontWeight: 'medium',
    color: 'secondary',
    transitionProperty: 'all',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceTint',
          '@supports (color: color-mix(in lab, red, red))': {
            backgroundColor: `color-mix(in oklab, ${vars.backgroundColor.surfaceTint} 50%, transparent) !custom`,
          },
          color: 'heading',
        },
      },
      '&[data-active]': {
        backgroundColor: 'surfaceTint',
        color: 'heading',
      },
    },
  })

  export const installCommand = style({
    cursor: 'pointer',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    paddingInline: '4',
    paddingBlock: '3',
    fontFamily: 'mono',
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'secondary',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          borderColor: 'accent7',
          '@supports (color: color-mix(in lab, red, red))': {
            borderColor: `color-mix(in oklab, ${vars.color.accent7} 50%, transparent) !custom`,
          },
        },
      },
    },
  })

  export const commandPrefix = style({
    color: 'accent7',
  })
}

export function Root(props: Root.Props) {
  const { children, className } = props
  return <div {...styles.root({ className })}>{children}</div>
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

  if (!logoUrl) return <h1 {...styles.title({ className })}>{title}</h1>

  if (typeof logoUrl === 'string')
    return <img alt={title} {...styles.logo({ className })} src={logoUrl} />

  return (
    <>
      <img alt={title} {...styles.lightLogo({ className })} src={logoUrl.light} />
      <img alt={title} {...styles.darkLogo({ className })} src={logoUrl.dark} />
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
  return <p {...styles.tagline({ className })}>{children}</p>
}

export declare namespace Tagline {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Description(props: Description.Props) {
  const { children, className } = props
  return <p {...styles.description({ className })}>{children}</p>
}

export declare namespace Description {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Buttons(props: Buttons.Props) {
  const { children, className } = props
  return <div {...styles.actions({ className })}>{children}</div>
}

export declare namespace Buttons {
  export type Props = {
    children: React.ReactNode
    className?: string | undefined
  }
}

export function Button(props: Button.Props) {
  const { children, href, variant = 'default', className } = props

  return (
    <Link
      to={href}
      {...cx(
        styles.button({ className }),
        variant === 'accent' && styles.accentButton(),
        variant === 'default' && styles.defaultButton(),
      )}
    >
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
      {...styles.installPackage()}
      onValueChange={(value) => setSelected(value as PackageManager)}
      value={selected}
    >
      <BaseTabs.List {...styles.packageManagers()}>
        {packageManagers.map((pm) => (
          <BaseTabs.Tab {...styles.packageManager()} key={pm} value={pm}>
            {pm}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {packageManagers.map((pm) => (
        <BaseTabs.Panel {...styles.installCommand()} key={pm} onClick={handleCopy} value={pm}>
          {copied ? (
            <span {...styles.commandPrefix()}>Copied!</span>
          ) : (
            <>
              <span {...styles.commandPrefix()}>{pm}</span> {getCommand(pm).replace(`${pm} `, '')}
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
