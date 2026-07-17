'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, Prompt, useConfig } from 'vocs'
import IconArrowUpRight from '~icons/lucide/arrow-up-right'
import IconCheck from '~icons/lucide/check'
import IconCopy from '~icons/lucide/copy'
import IconGithub from '~icons/simple-icons/github'
import IconBun from '~icons/vscode-icons/file-type-bun'
import IconNpm from '~icons/vscode-icons/file-type-npm'
import IconPnpm from '~icons/vscode-icons/file-type-pnpm'

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
    <div className="vocs:relative vocs:left-1/2 vocs:z-50 vocs:mt-[calc(-1*var(--vocs-spacing-banner)-var(--vocs-spacing-content-py))] vocs:mb-[calc(-1*var(--vocs-spacing-content-py))] vocs:flex vocs:h-[100svh] vocs:w-screen vocs:-translate-x-1/2 vocs:flex-col vocs:overflow-hidden vocs:bg-primary vocs:text-heading vocs:max-[700px]:h-auto vocs:max-[700px]:min-h-[100svh] vocs:max-[700px]:overflow-visible">
      <div className="vocs:pointer-events-none vocs:absolute vocs:inset-0 vocs:opacity-35 vocs:dark:opacity-20 vocs:[background-image:repeating-linear-gradient(45deg,transparent_0_27px,light-dark(var(--vocs-color-gray12),var(--vocs-border-color-primary))_27px_28px,transparent_28px_56px),repeating-linear-gradient(-45deg,transparent_0_27px,light-dark(var(--vocs-color-gray12),var(--vocs-border-color-primary))_27px_28px,transparent_28px_56px)]" />

      <header className="vocs:relative vocs:pb-4 vocs:pt-8 vocs:max-[700px]:pt-6">
        <div className="vocs:mx-auto vocs:flex vocs:w-full vocs:max-w-[900px] vocs:items-center vocs:justify-between vocs:gap-6 vocs:px-8 vocs:max-[700px]:px-5">
          <div className="vocs:inline-flex vocs:items-center vocs:gap-[18px]">
            <a href="/" aria-label={config.title} className="vocs:inline-flex vocs:no-underline">
              {logoUrl && typeof logoUrl === 'string' && (
                <img src={logoUrl} alt={config.title} className="vocs:h-6 vocs:w-auto" />
              )}
              {logoUrl && typeof logoUrl !== 'string' && (
                <>
                  <img
                    src={logoUrl.light}
                    alt={config.title}
                    className="vocs:h-6 vocs:w-auto vocs:dark:hidden"
                  />
                  <img
                    src={logoUrl.dark}
                    alt={config.title}
                    className="vocs:hidden vocs:h-6 vocs:w-auto vocs:dark:block"
                  />
                </>
              )}
              {!logoUrl && (
                <span className="vocs:text-[18px] vocs:font-semibold vocs:text-heading">
                  {config.title}
                </span>
              )}
            </a>
            {props.logoSuffix}
          </div>
          <a
            href={props.docsHref}
            className="vocs:inline-flex vocs:items-center vocs:gap-1.5 vocs:text-[13px] vocs:font-medium vocs:text-secondary vocs:no-underline vocs:transition-colors vocs:duration-100 vocs:hover:text-heading vocs:[&_svg]:size-3.5"
          >
            Docs
            <IconArrowUpRight aria-hidden />
          </a>
        </div>
      </header>

      <main className="vocs:relative vocs:flex vocs:min-h-0 vocs:flex-1 vocs:items-center vocs:pb-10 vocs:pt-6 vocs:max-[700px]:items-start vocs:max-[700px]:pb-8 vocs:max-[700px]:pt-10">
        <div className="vocs:mx-auto vocs:w-full vocs:max-w-[900px] vocs:px-8 vocs:max-[700px]:px-5">
          <section className="vocs:w-[min(100%,700px)]">
            <h1 className="vocs:m-0 vocs:mb-[18px] vocs:text-[clamp(40px,5.6vw,68px)] vocs:font-semibold vocs:leading-[0.96] vocs:tracking-[-0.025em] vocs:text-heading vocs:max-[700px]:text-[clamp(40px,12vw,54px)]">
              {title}
            </h1>
            <p className="vocs:m-0 vocs:mb-8 vocs:text-xl vocs:leading-[1.6] vocs:text-secondary vocs:max-[700px]:text-[17px]">
              {description}
            </p>

            <div className="vocs:mb-10 vocs:flex vocs:flex-wrap vocs:gap-3">
              <Link
                to={props.docsHref}
                className="vocs:inline-flex vocs:min-h-12 vocs:items-center vocs:justify-center vocs:gap-2.5 vocs:rounded-[var(--vocs-radius-lg)] vocs:border vocs:border-solid vocs:border-accent vocs:bg-accent vocs:px-[22px] vocs:text-[15px] vocs:font-medium vocs:text-accentInvert vocs:no-underline vocs:transition-opacity vocs:duration-100 vocs:hover:opacity-90 vocs:max-[700px]:w-full vocs:[&_svg]:size-3.5"
              >
                Read the docs
                <IconArrowUpRight aria-hidden />
              </Link>
              {github && (
                <a
                  href={github.link}
                  className="vocs:inline-flex vocs:min-h-12 vocs:items-center vocs:justify-center vocs:gap-2.5 vocs:rounded-[var(--vocs-radius-lg)] vocs:border vocs:border-solid vocs:border-primary vocs:bg-surface vocs:px-[22px] vocs:text-[15px] vocs:font-medium vocs:text-heading vocs:no-underline vocs:transition-colors vocs:duration-100 vocs:hover:border-secondary vocs:hover:bg-surfaceTint vocs:max-[700px]:w-full vocs:[&_svg]:size-3.5"
                >
                  <IconGithub aria-hidden />
                  GitHub
                </a>
              )}
            </div>

            <div className="vocs:mb-4 vocs:w-[min(100%,620px)] vocs:overflow-hidden vocs:rounded-[var(--vocs-radius-lg)] vocs:border vocs:border-solid vocs:border-primary vocs:bg-surface vocs:max-[700px]:w-full">
              <div className="vocs:flex vocs:items-stretch vocs:gap-1 vocs:border-b vocs:border-solid vocs:border-primary vocs:px-1">
                {packageManagers.map((pkg) => (
                  <button
                    key={pkg}
                    type="button"
                    data-active={packageManager === pkg || undefined}
                    onClick={() => setPackageManager(pkg)}
                    className={`vocs:-mb-px vocs:inline-flex vocs:cursor-pointer vocs:items-center vocs:gap-2 vocs:border-0 vocs:border-b-2 vocs:border-solid vocs:bg-transparent vocs:px-3.5 vocs:pb-[9px] vocs:pt-[11px] vocs:text-[13px] vocs:font-medium vocs:transition-colors vocs:duration-100 vocs:[&_svg]:size-[15px] ${
                      packageManager === pkg
                        ? 'vocs:border-white vocs:text-heading'
                        : 'vocs:border-transparent vocs:text-muted vocs:hover:text-heading'
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
                className="vocs:flex vocs:min-h-[68px] vocs:w-full vocs:cursor-pointer vocs:items-center vocs:gap-[18px] vocs:border-0 vocs:bg-transparent vocs:py-[18px] vocs:pl-0 vocs:pr-3 vocs:text-left vocs:transition-colors vocs:duration-100 vocs:hover:bg-surfaceTint"
              >
                <code className="vocs:font-mono vocs:text-lg vocs:text-accent">
                  <span className="vocs:text-muted">{runner}</span> {args.join(' ')}
                </code>
                <span
                  data-copied={copiedCommand || undefined}
                  className="vocs:ml-auto vocs:inline-flex vocs:size-8 vocs:items-center vocs:justify-center vocs:text-muted vocs:transition-colors vocs:duration-100 vocs:data-copied:text-success vocs:[&_svg]:size-4"
                >
                  {copiedCommand ? <IconCheck aria-hidden /> : <IconCopy aria-hidden />}
                </span>
              </button>
            </div>

            <Prompt
              className="vocs:w-[min(100%,620px)] vocs:max-[700px]:w-full"
              value={props.agentPrompt}
            />
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
