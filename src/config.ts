import type { ReactElement } from 'react'

type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type RequiredProperties = 'font' | 'root' | 'title' | 'titleTemplate'

export type Config<parsed extends boolean = false> = RequiredBy<
  {
    /**
     * General description for the documentation.
     */
    description?: string
    /**
     * Edit location for the documentation.
     */
    editLink?: {
      /**
       * Link pattern
       */
      pattern: string | (() => string)
      /**
       * Link text
       *
       * @default "Edit page"
       */
      text?: string
    }
    /* Base font face.
     *
     * @default { google: "Inter" }
     */
    font?: Font
    /**
     * Additional tags to include in the `<head>` tag of the page HTML.
     */
    head?: ReactElement
    /**
     * Icon URL.
     */
    iconUrl?: IconUrl
    /**
     * Logo URL.
     */
    logoUrl?: LogoUrl
    /**
     * Documentation root directory. Can be an absolute path, or a path relative from
     * the location of the config file itself.
     *
     * @default "docs"
     */
    root?: string
    /**
     * Navigation displayed on the sidebar.
     */
    sidebar?: Sidebar
    /**
     * Social links displayed in the top navigation.
     */
    socials?: parsed extends true ? ParsedSocials : Socials
    /**
     * Documentation title.
     *
     * @default "Docs"
     */
    title?: string
    /**
     * Template for the page title.
     *
     * @default `%s – ${title}`
     */
    titleTemplate?: string
  },
  parsed extends true ? RequiredProperties : never
>
export type ParsedConfig = Config<true>

export function defineConfig({
  font = { google: 'Inter' },
  head,
  root = 'docs',
  title = 'Docs',
  titleTemplate = `%s – ${title}`,
  ...config
}: Config): ParsedConfig {
  return {
    font,
    head,
    root,
    title,
    titleTemplate,
    ...config,
    socials: parseSocials(config.socials ?? []),
  }
}

export const defaultConfig = defineConfig({})

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

export type Font = {
  /** Name of the Google Font to use. */
  google?: string
}

export type IconUrl = string | { light: string; dark: string }

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
