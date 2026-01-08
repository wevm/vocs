import * as fs from 'node:fs'
import * as path from 'node:path'
import type * as MdxRollup from '@mdx-js/rollup'
import * as Langs from './langs.js'
import type * as Mdx from './mdx.js'
import type * as Redirects from './redirects.js'
import type * as Sidebar from './sidebar.js'
import type * as TopNav from './topNav.js'
import type { MaybePartial, UnionOmit } from './types.js'

export type ThemeValue<value> = { light: value; dark: value }

export type Config<partial extends boolean = false> = MaybePartial<
  partial,
  {
    /**
     * Accent color.
     *
     * - Use `light-dark()` syntax to define colors for light + dark schemes.
     * - Use a string to define a single color for all schemes.
     *
     * @default "light-dark(white, black)"
     *
     */
    accentColor: `light-dark(${string}, ${string})` | (string & {})
    // /**
    //  * Configuration for the banner fixed to the top of the page.
    //  *
    //  * Can be a Markdown string, a React Element, or an object with the following properties:
    //  * - `dismissable`: Whether or not the banner can be dismissed.
    //  * - `backgroundColor`: The background color of the banner.
    //  * - `content`: The content of the banner.
    //  * - `height`: The height of the banner.
    //  * - `textColor`: The text color of the banner.
    //  */
    // banner?: Banner<parsed>
    /**
     * The base path the documentation will be deployed at. All assets and pages
     * will be prefixed with this path. This is useful for deploying to GitHub Pages.
     * For example, if you are deploying to `https://example.github.io/foo`, then the
     * basePath should be set to `/foo`.
     *
     * @example
     * /docs
     */
    basePath: string
    /**
     * The base URL for your documentation. This is used to populate the `<base>` tag in the
     * `<head>` of the page, and is used to form the `%logo` variable for dynamic OG images.
     *
     * @example
     * https://vocs.dev
     */
    baseUrl?: string | undefined
    // /**
    //  * Path to blog pages relative to project root.
    //  * Used to extract posts from the filesystem.
    //  *
    //  * @default "./pages/blog"
    //  */
    // blogDir?: string
    /**
     * Absolute path to the directory to store cache files.
     */
    cacheDir: string
    /**
     * Whether or not to check for dead links in the documentation.
     *
     * - `true`: Enable dead link checking and throw errors on dead links.
     * - `false`: Disable dead link checking.
     * - `"warn"`: Enable dead link checking but only warn instead of throwing errors.
     *
     * @default true
     */
    checkDeadlinks: boolean | 'warn'
    /**
     * Code highlight configuration.
     */
    codeHighlight: MaybePartial<partial, UnionOmit<Mdx.rehypeShiki.Options, 'twoslash'>>
    /**
     * Color scheme.
     *
     * - Use `light` to set to light color scheme.
     * - Use `dark` to set to dark color scheme.
     * - Use `light dark` to set to system color scheme.
     *
     * @default "light dark"
     */
    colorScheme: 'light' | 'dark' | 'light dark'
    /**
     * General description for the documentation.
     */
    description?: string | undefined
    /**
     * Edit link configuration for "suggest changes" functionality.
     */
    editLink?:
      | {
          /**
           * Edit link URL. Use `:path` as placeholder for the file path.
           * Can also be a function for custom URL generation.
           * @example "https://github.com/org/repo/edit/main/docs/:path"
           */
          link: string | ((filePath: string) => string)
          /**
           * Link text displayed to the user.
           * @default "Suggest changes to this page"
           */
          text?: string | undefined
        }
      | undefined
    /**
     * Icon URL.
     */
    iconUrl?: string | ThemeValue<string> | undefined
    /**
     * Logo URL.
     */
    logoUrl?: string | ThemeValue<string> | undefined
    /**
     * OG Image URL. `null` to disable.
     *
     * Template variables: `%logo`, `%title`, `%description`
     *
     * @default "https://vocs.dev/api/og?logo=%logo&title=%title&description=%description"
     */
    ogImageUrl?: string | { [path: string]: string } | undefined
    /**
     * Markdown configuration.
     */
    markdown?: MdxRollup.Options | undefined
    /**
     * The output directory relative to root.
     * @default "dist"
     */
    outDir: string
    /**
     * The directory to store pages relative to `srcDir`.
     * @default "pages"
     */
    pagesDir: string
    /**
     * URL redirects. Maps incoming request paths to different destinations.
     * Supports path parameters (`:slug`) and wildcards (`:path*`).
     *
     * @example
     * redirects: [
     *   { source: '/about', destination: '/' },
     *   { source: '/docs/:path*', destination: '/documentation/:path*' },
     *   { source: '/old-page', destination: '/new-page', status: 301 },
     * ]
     */
    redirects?: Redirects.Inputs | undefined
    /**
     * Rendering strategy.
     *
     * - `full-static`: Full static site generation. Compatible with: Netlify, Vercel.
     * - `partial-static`: Partial static site (static pages; other routes are dynamic).
     * - `dynamic`: Dynamic site (all routes are dynamic).
     *
     * @default 'dynamic'
     */
    renderStrategy: 'full-static' | 'partial-static' | 'dynamic'
    /**
     * Root directory.
     * @default process.cwd()
     */
    rootDir: string
    /**
     * Configuration for docs search.
     * Accepts MiniSearch options for customizing search behavior.
     */
    search: MaybePartial<
      partial,
      {
        boost: Record<string, number>
        boostDocument: (id: string, term: string, storedFields?: Record<string, unknown>) => number
        combineWith: 'AND' | 'OR'
        fuzzy: number | boolean
        prefix: boolean
      }
    >
    /**
     * Navigation displayed on the sidebar.
     */
    sidebar?:
      | readonly Sidebar.SidebarItem<true>[]
      | {
          [path: string]:
            | readonly Sidebar.SidebarItem<true>[]
            | { backLink?: boolean; items: Sidebar.SidebarItem<true>[] }
        }
      | undefined
    /**
     * Social links displayed in the sidebar footer.
     */
    socials?: readonly SocialItem[] | undefined
    // /**
    //  * Set of sponsors to display on MDX directives and (optionally) the sidebar.
    //  */
    // sponsors?: SponsorSet[]
    /**
     * The source directory relative to `rootDir`.
     * @default "src"
     */
    srcDir: string
    /**
     * Documentation title.
     *
     * @default "Docs"
     */
    title: string
    /**
     * Template for the page title.
     *
     * @default `%s – ${title}`
     */
    titleTemplate: string
    /**
     * Navigation displayed on the top.
     */
    topNav?: readonly TopNav.Item[] | undefined
    /**
     * TwoSlash configuration. Set to `false` to disable.
     */
    twoslash?: Mdx.rehypeShiki.Options['twoslash'] | undefined
  }
>

export type SocialType = 'bluesky' | 'discord' | 'farcaster' | 'github' | 'telegram' | 'x'

export type SocialItem = {
  /** Social platform icon type */
  icon: SocialType
  /** Link URL */
  link: string
}

export type Frontmatter = {
  /** Author of the page. */
  author?: string | undefined
  /** Title of the page. */
  title?: string | undefined
  /** Description of the page. */
  description?: string | undefined
  /** File path relative to pages directory. */
  filePath?: string | undefined
  /** Last modified date of the page. */
  lastModified?: string | undefined
  /**
   * Whether to show the outline, or the depth of headings to show.
   * Set to `false` to hide the outline, or a number to limit depth.
   * @default true
   */
  outline?: boolean | number | undefined
  /** Robots directive (e.g., "noindex", "nofollow"). */
  robots?: string | undefined
  /** Additional metadata for the page. */
  [key: string]: unknown
}

export function define(config: define.Options = {}): Config {
  const {
    accentColor = 'light-dark(black, white)',
    basePath = '/',
    baseUrl,
    cacheDir = path.resolve(import.meta.dirname, '.vocs/cache'),
    codeHighlight,
    colorScheme = 'light dark',
    checkDeadlinks = true,
    description,
    iconUrl,
    logoUrl,
    ogImageUrl,
    markdown,
    renderStrategy = 'dynamic',
    outDir = 'dist',
    rootDir = process.cwd(),
    search,
    sidebar,
    socials,
    srcDir = 'src',
    title = 'Docs',
    titleTemplate = `%s – ${title}`,
    topNav,
    redirects,
    twoslash,
  } = config

  const pagesDir = 'pages'

  return {
    accentColor,
    baseUrl,
    basePath,
    cacheDir,
    checkDeadlinks,
    codeHighlight: {
      ...codeHighlight,
      langs: codeHighlight?.langs ?? (Langs.infer({ rootDir, srcDir, pagesDir }) as never),
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
        ...(codeHighlight?.themes ?? {}),
      },
    },
    colorScheme,
    description,
    editLink: config.editLink
      ? { text: 'Suggest changes to this page', ...config.editLink }
      : undefined,
    iconUrl,
    logoUrl,
    markdown,
    ogImageUrl,
    outDir,
    pagesDir,
    redirects,
    renderStrategy,
    rootDir,
    search: {
      ...search,
      boostDocument:
        search?.boostDocument ??
        ((_id, _term, storedFields) => {
          const priority = (storedFields?.['searchPriority'] as number | undefined) ?? 1
          const href = storedFields?.['href'] as string | undefined
          const isDocsPath = href?.startsWith('/docs/')
          // Treat /docs/ as root for depth calculation (subtract 1)
          const segments = href ? href.split('/').filter(Boolean).length : 1
          const depth = isDocsPath ? Math.max(segments - 1, 1) : segments
          const depthBoost = 1 / Math.max(depth, 1)
          const docsBoost = isDocsPath ? 1.5 : 1
          return priority * depthBoost * docsBoost
        }),
      combineWith: search?.combineWith ?? 'AND',
      fuzzy: search?.fuzzy ?? 0.2,
      prefix: search?.prefix ?? true,
      boost: { title: 4, subtitle: 3, text: 2, category: 1, titles: 1, ...search?.boost },
    },
    sidebar,
    socials,
    srcDir,
    topNav,
    title,
    titleTemplate,
    twoslash,
  }
}

export declare namespace define {
  export type Options = UnionOmit<Config<true>, 'pagesDir'>
}

export function getConfigFile(options: getConfigFile.Options = {}): string | undefined {
  const { rootDir = process.cwd() } = options

  return fs.globSync('vocs.config.{ts,js,mjs,mts}', { cwd: rootDir })[0]
}

declare namespace getConfigFile {
  export type Options = {
    rootDir?: string | undefined
  }
}

export async function resolve(options: resolve.Options = {}): Promise<Config> {
  const { server, rootDir = process.cwd() } = options

  if (server && process.env['NODE_ENV'] === 'production') {
    const configPath = path.resolve(import.meta.dirname, '../vocs.config.js')
    const resolved = (await import(/* @vite-ignore */ configPath)).default as Config
    return resolved
  }

  const configFile = getConfigFile({ rootDir })
  if (!configFile) return define({})

  const vite = await import('vite')
  const result = await vite.loadConfigFromFile(
    { command: 'build', mode: 'development' },
    configFile,
    rootDir,
  )
  if (!result) return define({ rootDir })

  return define({ ...result.config, rootDir })
}

declare namespace resolve {
  export type Options = {
    server?: boolean | undefined
    rootDir?: string | undefined
  }
}

export let global: Config | undefined

export function setGlobal(config: Config) {
  global = config
}

export function getGlobal(): Config {
  if (!global) throw new Error('cannot get global config before it is set')
  return global
}
