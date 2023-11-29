import type { ReactElement } from 'react'

type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type RequiredProperties = 'blogDir' | 'root' | 'title' | 'titleTemplate'

export type Config<parsed extends boolean = false> = RequiredBy<
  {
    /**
     * Base URL.
     *
     * @example
     * https://viem.sh
     */
    baseUrl?: string
    /**
     * Path to blog pages relative to project root.
     * Used to extract posts from the filesystem.
     *
     * @default "./pages/blog"
     */
    blogDir?: string
    /**
     * General description for the documentation.
     */
    description?: string
    /**
     * Edit location for the documentation.
     */
    editLink?: EditLink
    /**
     * Base font face.
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
     * OG Image URL. `null` to disable.
     *
     * Template variables: `%logo`, `%title`, `%description`
     *
     * @default "https://vocs.dev/api/og?logo=%logo&title=%title&description=%description"
     */
    ogImageUrl?: string | { [path: string]: string }
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
    /**
     * Navigation displayed on the top.
     */
    topNav?: TopNav
  },
  parsed extends true ? RequiredProperties : never
>
export type ParsedConfig = Config<true>

export function defineConfig({
  blogDir = './pages/blog',
  font,
  head,
  ogImageUrl = 'https://vocs.dev/api/og?logo=%logo&title=%title&description=%description',
  root = 'docs',
  title = 'Docs',
  titleTemplate = `%s – ${title}`,
  ...config
}: Config): ParsedConfig {
  return {
    blogDir,
    font,
    head,
    ogImageUrl,
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

export type EditLink = {
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

export type Font = {
  /** Name of the Google Font to use. */
  google?: string
}

export type IconUrl = string | { light: string; dark: string }

export type LogoUrl = string | { light: string; dark: string }

export type SidebarItem = {
  /** Whether or not to collapse the sidebar item by default. */
  collapsed?: boolean
  /** Text to display on the sidebar. */
  text: string
  /** Optional pathname to the target documentation page. */
  // TODO: support external links
  link?: string
  /** Optional children to nest under this item. */
  items?: SidebarItem[]
}

export type Sidebar = SidebarItem[] | { [path: string]: SidebarItem[] }

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

export type TopNavItem = {
  text: string
} & ({ link: string; children?: never } | { link?: string; children: TopNavItem[] })
export type TopNav = TopNavItem[]
