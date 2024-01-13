import type { TwoSlashOptions } from '@typescript/twoslash'
import chroma from 'chroma-js'
import type { ReactElement } from 'react'
import type { Options as PrettyCodeOptions } from 'rehype-pretty-code'
import type { PluggableList } from 'unified'
import type { UserConfig } from 'vite'
import type {
  borderRadiusVars,
  contentVars,
  fontFamilyVars,
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  outlineVars,
  primitiveColorVars,
  semanticColorVars,
  sidebarVars,
  spaceVars,
  topNavVars,
  viewportVars,
  zIndexVars,
} from './app/styles/vars.css.js'

type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type RequiredProperties = 'blogDir' | 'markdown' | 'rootDir' | 'title' | 'titleTemplate'

export type Config<
  parsed extends boolean = false,
  colorScheme extends ColorScheme = ColorScheme,
> = RequiredBy<
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
    editLink?: Normalize<EditLink>
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
    iconUrl?: Normalize<IconUrl>
    /**
     * Logo URL.
     */
    logoUrl?: Normalize<LogoUrl>
    /**
     * OG Image URL. `null` to disable.
     *
     * Template variables: `%logo`, `%title`, `%description`
     *
     * @default "https://vocs.dev/api/og?logo=%logo&title=%title&description=%description"
     */
    ogImageUrl?: string | { [path: string]: string }
    /**
     * Markdown configuration.
     */
    markdown?: Normalize<Markdown<parsed>>
    /**
     * Documentation root directory. Can be an absolute path, or a path relative from
     * the location of the config file itself.
     *
     * @default "docs"
     */
    rootDir?: string
    /**
     * Navigation displayed on the sidebar.
     */
    sidebar?: Normalize<Sidebar>
    /**
     * Social links displayed in the top navigation.
     */
    socials?: Normalize<Socials<parsed>>
    /**
     * Set of sponsors to display on MDX directives and (optionally) the sidebar.
     */
    sponsors?: SponsorSet[]
    /**
     * Theme configuration.
     */
    theme?: Normalize<Theme<parsed, colorScheme>>
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
    topNav?: Normalize<TopNav<parsed>>
    /**
     * TwoSlash configuration.
     */
    twoslash?: Normalize<TwoSlashOptions>
    /**
     * Vite configuration.
     */
    vite?: UserConfig
  },
  parsed extends true ? RequiredProperties : never
>

export type ParsedConfig = Config<true>

export function defineConfig<colorScheme extends ColorScheme = undefined>({
  blogDir = './pages/blog',
  font,
  head,
  ogImageUrl,
  rootDir = 'docs',
  title = 'Docs',
  titleTemplate = `%s – ${title}`,
  ...config
}: Config<false, colorScheme>): ParsedConfig {
  return {
    blogDir,
    font,
    head,
    ogImageUrl,
    rootDir,
    title,
    titleTemplate,
    ...config,
    markdown: parseMarkdown(config.markdown ?? {}),
    socials: parseSocials(config.socials ?? []),
    topNav: parseTopNav(config.topNav ?? []),
    theme: parseTheme(config.theme ?? ({} as Theme)),
  }
}

export const defaultConfig = defineConfig({})

//////////////////////////////////////////////////////
// Parsers

function parseMarkdown(markdown: Markdown): Markdown<true> {
  return {
    ...markdown,
    code: {
      keepBackground: false,
      theme: {
        dark: 'github-dark-dimmed',
        light: 'github-light',
      },
      ...markdown.code,
    },
  }
}

const socialsMeta = {
  discord: { label: 'Discord', type: 'discord' },
  github: { label: 'GitHub', type: 'github' },
  telegram: { label: 'Telegram', type: 'telegram' },
  x: { label: 'X (Twitter)', type: 'x' },
} satisfies Record<SocialItem['icon'], { label: string; type: SocialType }>

function parseSocials(socials: Socials): Socials<true> {
  return socials.map((social) => {
    return {
      icon: social.icon,
      link: social.link,
      ...socialsMeta[social.icon],
    }
  })
}

let id = 0

function parseTopNav(topNav: TopNav): TopNav<true> {
  const parsedTopNav: ParsedTopNavItem[] = []
  for (const item of topNav) {
    parsedTopNav.push({
      ...item,
      id: id++,
      items: item.items ? parseTopNav(item.items) : [],
    })
  }
  return parsedTopNav
}

function parseTheme<colorScheme extends ColorScheme = undefined>(
  theme: Theme<false, colorScheme>,
): Theme<true> {
  const accentColor = (() => {
    if (!theme.accentColor) return theme.accentColor
    if (
      typeof theme.accentColor === 'object' &&
      !Object.keys(theme.accentColor).includes('light') &&
      !Object.keys(theme.accentColor).includes('dark')
    )
      return theme.accentColor

    const accentColor = theme.accentColor as string | { light: string; dark: string }
    const accentColorLight = typeof accentColor === 'object' ? accentColor.light : accentColor
    const accentColorDark = typeof accentColor === 'object' ? accentColor.dark : accentColor
    return {
      backgroundAccent: {
        dark: accentColorDark,
        light: accentColorLight,
      },
      backgroundAccentHover: {
        dark: chroma(accentColorDark).darken(0.25).hex(),
        light: chroma(accentColorLight).darken(0.25).hex(),
      },
      backgroundAccentText: {
        dark: chroma.contrast(accentColorDark, 'white') < 4.5 ? 'black' : 'white',
        light: chroma.contrast(accentColorLight, 'white') < 4.5 ? 'black' : 'white',
      },
      borderAccent: {
        dark: chroma(accentColorDark).brighten(0.5).hex(),
        light: chroma(accentColorLight).darken(0.25).hex(),
      },
      textAccent: {
        dark: accentColorDark,
        light: accentColorLight,
      },
      textAccentHover: {
        dark: chroma(accentColorDark).darken(0.5).hex(),
        light: chroma(accentColorLight).darken(0.5).hex(),
      },
    } satisfies Theme<true>['accentColor']
  })()
  return {
    ...theme,
    accentColor,
  } as Theme<true>
}

//////////////////////////////////////////////////////
// Types

type Normalize<T> = {
  [K in keyof T]: T[K]
} & {}

export type ColorScheme = 'light' | 'dark' | 'system' | undefined

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

export type Markdown<parsed extends boolean = false> = RequiredBy<
  {
    code?: Normalize<PrettyCodeOptions>
    remarkPlugins?: PluggableList
    rehypePlugins?: PluggableList
  },
  parsed extends true ? 'code' : never
>

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

export type Sidebar =
  | SidebarItem[]
  | { [path: string]: SidebarItem[] | { backLink?: boolean; items: SidebarItem[] } }

export type SocialType = 'discord' | 'github' | 'telegram' | 'x'
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

export type Socials<parsed extends boolean = false> = parsed extends true
  ? ParsedSocialItem[]
  : SocialItem[]

export type Sponsor = {
  /** The name of the sponsor. */
  name: string
  /** The link to the sponsor's website. */
  link: string
  /** The image to display for the sponsor. */
  image: string
}
export type SponsorSet = {
  /** The list of sponsors to display. */
  items: (Sponsor | null)[][]
  /** The name of the sponsor set (e.g. "Gold Sponsors", "Collaborators", etc). */
  name: string
  /** The height of the sponsor images. */
  height?: number
}

export type ThemeVariables<variables extends Record<string, unknown>, value> = {
  [key in keyof variables]?: value
}
export type Theme<
  parsed extends boolean = false,
  colorScheme extends ColorScheme = ColorScheme,
  ///
  colorValue = colorScheme extends 'system' | undefined ? { light: string; dark: string } : string,
> = {
  accentColor?: Exclude<
    | string
    | (colorScheme extends 'system' | undefined ? { light: string; dark: string } : never)
    | Required<
        ThemeVariables<
          Pick<
            typeof primitiveColorVars,
            | 'backgroundAccent'
            | 'backgroundAccentHover'
            | 'backgroundAccentText'
            | 'borderAccent'
            | 'textAccent'
            | 'textAccentHover'
          >,
          colorValue
        >
      >,
    parsed extends true ? string | { light: string; dark: string } : never
  >
  colorScheme?: colorScheme
  variables?: {
    borderRadius?: ThemeVariables<typeof borderRadiusVars, string>
    color?: ThemeVariables<typeof primitiveColorVars, colorValue> &
      ThemeVariables<typeof semanticColorVars, colorValue>
    content?: ThemeVariables<typeof contentVars, string>
    fontFamily?: ThemeVariables<typeof fontFamilyVars, string>
    fontSize?: ThemeVariables<typeof fontSizeVars, string>
    fontWeight?: ThemeVariables<typeof fontWeightVars, string>
    lineHeight?: ThemeVariables<typeof lineHeightVars, string>
    outline?: ThemeVariables<typeof outlineVars, string>
    sidebar?: ThemeVariables<typeof sidebarVars, string>
    space?: ThemeVariables<typeof spaceVars, string>
    topNav?: ThemeVariables<typeof topNavVars, string>
    viewport?: ThemeVariables<typeof viewportVars, string>
    zIndex?: ThemeVariables<typeof zIndexVars, string>
  }
}

export type TopNavItem<parsed extends boolean = false> = {
  match?: string
  text: string
} & (
  | { link: string; items?: never }
  | { link?: string; items: parsed extends true ? ParsedTopNavItem[] : TopNavItem[] }
)
export type ParsedTopNavItem = TopNavItem<true> & {
  id: number
}

export type TopNav<parsed extends boolean = false> = parsed extends true
  ? ParsedTopNavItem[]
  : TopNavItem[]
