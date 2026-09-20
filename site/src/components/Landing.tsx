'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, Prompt, useConfig } from 'vocs'
import { style, theme } from 'zyzz/default'
import IconArrowUpRight from '~icons/lucide/arrow-up-right'
import IconCheck from '~icons/lucide/check'
import IconCopy from '~icons/lucide/copy'
import IconGithub from '~icons/simple-icons/github'
import IconBun from '~icons/vscode-icons/file-type-bun'
import IconNpm from '~icons/vscode-icons/file-type-npm'
import IconPnpm from '~icons/vscode-icons/file-type-pnpm'

namespace styles {
  export const byline = style({ fontSize: '13px', fontWeight: 'medium', color: 'gray.900' })
  export const bylineLink = style({
    color: 'gray.900',
    textDecoration: 'none',
    transition: 'color 100ms',
    ':hover': { color: 'foreground' },
  })
  export const titleEmphasis = style({
    display: 'block',
    fontWeight: 'semibold',
    fontStyle: 'normal',
    color: 'foreground',
  })
  export const landing = style({
    position: 'relative',
    left: 'calc(1 / 2 * 100%)',
    zIndex: 50,
    marginTop: 'calc(-1 * var(--vocs-layout-banner) - var(--vocs-layout-content-py))',
    marginBottom: 'calc(-1 * var(--vocs-layout-content-py))',
    display: 'flex',
    height: '100svh',
    width: '100vw',
    translate: 'calc(calc(1 / 2 * 100%) * -1) ',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: theme.vars.color.background['200'],
    color: theme.vars.color.foreground,
    '@media (width < 700px)': { height: 'auto', minHeight: '100svh', overflow: 'visible' },
  })
  export const landing2 = style({
    pointerEvents: 'none',
    position: 'absolute',
    inset: 0,
    backgroundImage: `repeating-linear-gradient(45deg,transparent 0 27px,${theme.vars.color.gray[300]} 27px 28px,transparent 28px 56px),repeating-linear-gradient(-45deg,transparent 0 27px,${theme.vars.color.gray[300]} 27px 28px,transparent 28px 56px)`,
    opacity: '35%',
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        opacity: '20%',
      },
    },
  })
  export const landing3 = style({
    position: 'relative',
    paddingTop: 8,
    paddingBottom: 4,
    '@media (width < 700px)': { paddingTop: 6 },
  })
  export const landing4 = style({
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '900px',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingInline: 8,
    '@media (width < 700px)': { paddingInline: 5 },
  })
  export const landing5 = style({ display: 'inline-flex', alignItems: 'center', gap: '18px' })
  export const landing6 = style({ display: 'inline-flex', textDecorationLine: 'none' })
  export const landing7 = style({ height: 6, width: 'auto' })
  export const landing8 = style({
    height: 6,
    width: 'auto',
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'none',
      },
    },
  })
  export const landing9 = style({
    display: 'none',
    height: 6,
    width: 'auto',
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'block',
      },
    },
  })
  export const landing10 = style({
    fontSize: '18px',
    fontWeight: 'semibold',
    color: theme.vars.color.foreground,
  })
  export const landing11 = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'calc(0.25rem * 1.5)',
    fontSize: '13px',
    fontWeight: 'medium',
    color: theme.vars.color.gray['900'],
    textDecorationLine: 'none',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: {
      '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } },
      '& svg': { width: 'calc(0.25rem * 3.5)', height: 'calc(0.25rem * 3.5)' },
    },
  })
  export const landing12 = style({
    position: 'relative',
    display: 'flex',
    minHeight: 0,
    flex: 1,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 10,
    '@media (width < 700px)': {
      alignItems: 'flex-start',
      paddingTop: 10,
      paddingBottom: 8,
    },
  })
  export const landing13 = style({
    marginInline: 'auto',
    width: '100%',
    maxWidth: '900px',
    paddingInline: 8,
    '@media (width < 700px)': { paddingInline: 5 },
  })
  export const landing14 = style({ width: 'min(100%, 700px)' })
  export const landing15 = style({
    margin: 0,
    marginBottom: '18px',
    fontSize: 'clamp(40px, 5.6vw, 68px)',
    lineHeight: 0.96,
    fontWeight: 'semibold',
    letterSpacing: '-0.025em',
    color: theme.vars.color.foreground,
    '@media (width < 700px)': { fontSize: 'clamp(40px, 12vw, 54px)' },
  })
  export const landing16 = style({
    margin: 0,
    marginBottom: 8,
    fontSize: 'xl',
    lineHeight: 1.6,
    color: theme.vars.color.gray['900'],
    '@media (width < 700px)': { fontSize: '17px' },
  })
  export const landing17 = style({
    marginBottom: 10,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
  })
  export const landing18 = style({
    display: 'inline-flex',
    minHeight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'calc(0.25rem * 2.5)',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.blue['700'],
    backgroundColor: theme.vars.color.blue['700'],
    paddingInline: '22px',
    fontSize: '15px',
    fontWeight: 'medium',
    color: theme.vars.color.white,
    textDecorationLine: 'none',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: {
      '&:hover': { '@media (hover: hover)': { opacity: '90%' } },
      '& svg': { width: 'calc(0.25rem * 3.5)', height: 'calc(0.25rem * 3.5)' },
    },
    '@media (width < 700px)': { width: '100%' },
  })
  export const landing19 = style({
    display: 'inline-flex',
    minHeight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'calc(0.25rem * 2.5)',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingInline: '22px',
    fontSize: '15px',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
    textDecorationLine: 'none',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          borderColor: theme.vars.color.gray['300'],
          backgroundColor: theme.vars.color.gray['100'],
        },
      },
      '& svg': { width: 'calc(0.25rem * 3.5)', height: 'calc(0.25rem * 3.5)' },
    },
    '@media (width < 700px)': { width: '100%' },
  })
  export const landing20 = style({
    marginBottom: 4,
    width: 'min(100%, 620px)',
    overflow: 'hidden',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    '@media (width < 700px)': { width: '100%' },
  })
  export const landing21 = style({
    display: 'flex',
    alignItems: 'stretch',
    gap: 1,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.vars.color.gray['400'],
    paddingInline: 1,
  })
  export const landing22 = style({
    marginBottom: '-1px',
    display: 'inline-flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 2,
    borderStyle: 'solid',
    borderWidth: '0px',
    borderBottomStyle: 'solid',
    borderBottomWidth: '2px',
    backgroundColor: 'transparent',
    paddingInline: 'calc(0.25rem * 3.5)',
    paddingTop: '11px',
    paddingBottom: '9px',
    fontSize: '13px',
    fontWeight: 'medium',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: { '& svg': { width: '15px', height: '15px' } },
  })
  export const landing23 = style({ borderColor: 'white', color: theme.vars.color.foreground })
  export const landing24 = style({
    borderColor: 'transparent',
    color: theme.vars.color.gray['800'],
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const landing25 = style({
    display: 'flex',
    minHeight: '68px',
    width: '100%',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '18px',
    borderStyle: 'solid',
    borderWidth: '0px',
    backgroundColor: 'transparent',
    paddingBlock: '18px',
    paddingRight: 3,
    paddingLeft: 0,
    textAlign: 'left',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: {
      '&:hover': { '@media (hover: hover)': { backgroundColor: theme.vars.color.gray['100'] } },
    },
  })
  export const landing26 = style({
    fontFamily: theme.vars.fontFamily.mono,
    fontSize: 'lg',
    lineHeight: 'calc(1.75 / 1.125)',
    color: theme.vars.color.blue['900'],
  })
  export const landing27 = style({ color: theme.vars.color.gray['800'] })
  export const landing28 = style({
    marginLeft: 'auto',
    display: 'inline-flex',
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.vars.color.gray['800'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: {
      '&[data-copied]': { color: theme.vars.color.green['900'] },
      '& svg': { width: 4, height: 4 },
    },
  })
  export const landing29 = style({
    width: 'min(100%, 620px)',
    '@media (width < 700px)': { width: '100%' },
  })
}

type PackageManager = 'npm' | 'pnpm' | 'bun'
type PackageType = 'init' | 'install'
type ThemeValue<value> = { dark: value; light: value }

const packageManagers = ['npm', 'pnpm', 'bun'] as const

const packageIcons = {
  npm: <IconNpm aria-hidden />,
  pnpm: <IconPnpm aria-hidden />,
  bun: <IconBun aria-hidden />,
} satisfies Record<PackageManager, ReactNode>

function getPackageCommand(packageManager: PackageManager, name: string, type: PackageType) {
  if (type === 'init') {
    if (packageManager === 'npm') return `npm init ${name}`
    if (packageManager === 'pnpm') return `pnpm create ${name}`
    return `bun create ${name}`
  }

  if (packageManager === 'npm') return `npm install ${name}`
  if (packageManager === 'pnpm') return `pnpm add ${name}`
  return `bun add ${name}`
}

export function Landing(props: Landing.Props) {
  const config = useConfig()
  const [packageManager, setPackageManager] = useState<PackageManager>('npm')
  const [copiedCommand, setCopiedCommand] = useState(false)

  const github = config.socials?.find((social) => social.icon === 'github')
  const logoUrl = props.logoUrl ?? config.logoUrl
  const title = props.title ?? config.title
  const description = props.description ?? config.description

  async function copyCommand() {
    await navigator.clipboard.writeText(
      getPackageCommand(packageManager, props.packageName, props.packageType),
    )
    setCopiedCommand(true)
    setTimeout(() => setCopiedCommand(false), 2_000)
  }

  const command = getPackageCommand(packageManager, props.packageName, props.packageType)
  const [runner, ...args] = command.split(' ')

  return (
    <div {...styles.landing()}>
      <div {...styles.landing2()} />

      <header {...styles.landing3()}>
        <div {...styles.landing4()}>
          <div {...styles.landing5()}>
            <a href="/" aria-label={config.title} {...styles.landing6()}>
              {logoUrl && typeof logoUrl === 'string' && (
                <img src={logoUrl} alt={config.title} {...styles.landing7()} />
              )}
              {logoUrl && typeof logoUrl !== 'string' && (
                <>
                  <img src={logoUrl.light} alt={config.title} {...styles.landing8()} />
                  <img src={logoUrl.dark} alt={config.title} {...styles.landing9()} />
                </>
              )}
              {!logoUrl && <span {...styles.landing10()}>{config.title}</span>}
            </a>
            {props.logoSuffix}
          </div>
          <a href={props.docsHref} {...styles.landing11()}>
            Docs
            <IconArrowUpRight aria-hidden />
          </a>
        </div>
      </header>

      <main {...styles.landing12()}>
        <div {...styles.landing13()}>
          <section {...styles.landing14()}>
            <h1 {...styles.landing15()}>{title}</h1>
            <p {...styles.landing16()}>{description}</p>

            <div {...styles.landing17()}>
              <Link to={props.docsHref} className={styles.landing18().className}>
                Read the docs
                <IconArrowUpRight aria-hidden />
              </Link>
              {github && (
                <a href={github.link} {...styles.landing19()}>
                  <IconGithub aria-hidden />
                  GitHub
                </a>
              )}
            </div>

            <div {...styles.landing20()}>
              <div {...styles.landing21()}>
                {packageManagers.map((pkg) => (
                  <button
                    key={pkg}
                    type="button"
                    data-active={packageManager === pkg || undefined}
                    onClick={() => setPackageManager(pkg)}
                    className={`${styles.landing22().className} ${
                      packageManager === pkg
                        ? styles.landing23().className
                        : styles.landing24().className
                    }`}
                  >
                    {packageIcons[pkg]}
                    {pkg}
                  </button>
                ))}
              </div>

              <button
                type="button"
                aria-label="Copy command"
                onClick={copyCommand}
                {...styles.landing25()}
              >
                <code {...styles.landing26()}>
                  <span {...styles.landing27()}>{runner}</span> {args.join(' ')}
                </code>
                <span data-copied={copiedCommand || undefined} {...styles.landing28()}>
                  {copiedCommand ? <IconCheck aria-hidden /> : <IconCopy aria-hidden />}
                </span>
              </button>
            </div>

            <Prompt className={styles.landing29().className} value={props.agentPrompt} />
          </section>
        </div>
      </main>
    </div>
  )
}

export declare namespace Landing {
  export type Props = {
    /** Agent setup instructions rendered by `Prompt`. */
    agentPrompt: string
    /** Landing page description. Falls back to the site description. */
    description?: ReactNode | undefined
    /** Docs link URL. */
    docsHref: string
    /** Logo URL. Falls back to the site logo URL. */
    logoUrl?: string | ThemeValue<string> | undefined
    /** Content rendered next to the logo. */
    logoSuffix?: ReactNode | undefined
    /** Package name used to infer package manager commands. */
    packageName: string
    /** Package command type used to infer package manager commands. */
    packageType: PackageType
    /** Landing page title. Falls back to the site title. */
    title?: ReactNode | undefined
  }
}

export function Byline() {
  return (
    <span {...styles.byline()}>
      by{' '}
      <a href="https://wevm.dev" {...styles.bylineLink()}>
        Wevm
      </a>
    </span>
  )
}

export function Title() {
  return (
    <>
      Minimal Docs
      <br />
      <em {...styles.titleEmphasis()}>for Agents &amp; Humans.</em>
    </>
  )
}
