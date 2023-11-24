import { resolve } from 'node:path'

type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type RequiredProperties = 'root' | 'title'

export type Config<parsed extends boolean = false> = RequiredBy<
  {
    /** Logo URL. */
    logoUrl?: LogoUrl
    /** Path to documentation pages. @default "./docs" */
    root?: string
    /** Navigation displayed on the sidebar. */
    sidebar?: Sidebar
    /** Social links displayed in the top navigation. */
    socials?: parsed extends true ? ParsedSocials : Socials
    /** Title for your documentation. @default "Docs" */
    title?: string
  },
  parsed extends true ? RequiredProperties : never
>
export type ParsedConfig = Config<true>

export function defineConfig({
  root = resolve(process.cwd(), './docs'),
  title = 'Docs',
  ...config
}: Config): ParsedConfig {
  return {
    root,
    title,
    ...config,
    socials: parseSocials(config.socials ?? []),
  }
}

//////////////////////////////////////////////////////
// Parsers

const socialsMeta = {
  discord: { label: 'Discord', type: 'discord' },
  github: { label: 'GitHub', type: 'github' },
  x: { label: 'X (Twitter)', type: 'x' },
} satisfies Record<SocialItem['icon'], { label: string; type: SocialType }>

function parseSocials(socials: Socials): ParsedSocials {
  return socials.map((social) => {
    return {
      icon: social.icon,
      link: social.link,
      ...socialsMeta[social.icon],
    }
  })
}

//////////////////////////////////////////////////////
// Types

export type LogoUrl = string | { light: string; dark: string }

export type SidebarItem = {
  /** Title to display on the sidebar. */
  title: string
  /** Optional pathname to the target documentation page. */
  path?: string
  /** Optional children to nest under this item. */
  children?: SidebarItem[]
}

export type Sidebar = SidebarItem[]

export type SocialType = 'discord' | 'github' | 'x'
export type SocialItem = {
  /** Social icon to display. */
  icon: SocialType // TODO: Support custom SVG icons
  /** Label for the social. */
  label?: string
  /** Link to the social. */
  link: string
}
export type ParsedSocialItem = Required<SocialItem> & {
  /** The type of social item. */
  type: SocialType
}

export type Socials = SocialItem[]
export type ParsedSocials = ParsedSocialItem[]
