import * as fs from 'node:fs'
import * as path from 'node:path'
import type * as MdxRollup from '@mdx-js/rollup'
import type {
  Options as MiniSearchOptions,
  SearchOptions as MiniSearchSearchOptions,
} from 'minisearch'
import type { Link, MetaFlat, Script, StringInnerContent, Style } from 'unhead/types'
import type * as Changelog from './changelog.js'
import type * as Feedback from './feedback.js'
import * as Langs from './langs.js'
import type * as McpSource from './mcp-source.js'
import type * as Mdx from './mdx.js'
import type * as OpenApi from './openapi/index.js'
import { from as resolveOpenApi } from './openapi/openapi.js'
import type * as Redirects from './redirects.js'
import * as Retriever from './retriever.js'
import type * as Sidebar from './sidebar.js'
import type * as TopNav from './topNav.js'
import type { MaybePartial, UnionOmit } from './types.js'

export type ThemeValue<value> = { light: value; dark: value }

export type RoutePredicate<context> = boolean | ((path: string, context: context) => boolean)

export type TitleTemplate =
  | string
  | ((
      path: string,
      context: {
        frontmatter?: Frontmatter | undefined
        title: string | undefined
        siteTitle: string
      },
    ) => string | undefined)

/**
 * `<meta>` tags, keyed by unhead's flat meta schema (e.g. `ogTitle`, `twitterCard`,
 * `themeColor`). Set a value to override the generated tag (or add a new one), or
 * `false` to omit it.
 */
export type HeadMeta = {
  [key in keyof MetaFlat]?: MetaFlat[key] | false | undefined
}

export type HeadTags = {
  /** `<base>` href. Set a value to override, or `false` to omit. */
  base?: string | false | undefined
  /** `<link rel="canonical">` href. Set a value to override, or `false` to omit. */
  canonical?: string | false | undefined
  /** `<link rel="icon">` tags. Set `false` to omit (values come from `iconUrl`). */
  icons?: false | undefined
  /** Additional `<link>` tags. */
  link?: Link[] | undefined
  /** `<meta>` tag overrides and additions. */
  meta?: HeadMeta | undefined
  /** Additional `<script>` tags. */
  script?: Script[] | undefined
  /** Additional `<style>` tags. */
  style?: (Style & StringInnerContent)[] | undefined
  /** `<title>` text (bypasses `titleTemplate`). Set a value to override, or `false` to omit. */
  title?: string | false | undefined
}

export type HeadOptions =
  | false
  | HeadTags
  | ((
      path: string,
      context: { frontmatter?: Frontmatter | undefined },
    ) => HeadTags | false | undefined)

export type SitemapOptions = {
  /**
   * Controls which pages Vocs includes in the generated sitemap.
   */
  include?: RoutePredicate<{ filePath: string }> | undefined
  /**
   * Controls `<lastmod>` output. Return `false` to omit it, `true` to use Vocs' inferred date, or
   * a string to provide a route-specific date.
   */
  lastmod?:
    | boolean
    | ((
        path: string,
        context: {
          filePath: string
          lastmod: string
        },
      ) => boolean | string | undefined)
    | undefined
}

type SearchDocument = {
  category: string
  href: string
  id: string
  searchPriority: number | undefined
  subtitle: string
  text: string
  title: string
  titles: string[]
  type: 'page' | 'section' | 'nav'
}

export type SearchIndexOptions = Omit<MiniSearchOptions<SearchDocument>, 'fields'> & {
  /**
   * Document fields to index during MiniSearch build and load.
   *
   * Replaces the Vocs default indexed fields: `category`, `subtitle`, `text`, `title`, and
   * `titles`. Runs on the server when Vocs builds the index, and is reused in the browser when
   * loading the serialized index.
   */
  fields?: string[]
  /**
   * Document fields to store on search results during MiniSearch build and load.
   *
   * Extends the required Vocs UI fields. Required fields are always stored even when omitted:
   * `category`, `href`, `searchPriority`, `subtitle`, `text`, `title`, `titles`, and `type`.
   * Runs on the server when Vocs builds the index, and is reused in the browser when loading the
   * serialized index.
   */
  storeFields?: string[]
  /**
   * Document field used as the unique MiniSearch id.
   *
   * Defaults to `id`. Replaces the MiniSearch id field during server index build and browser index
   * load. Changing this is advanced because Vocs HMR and UI behavior expect stable document ids.
   */
  idField?: string
  /**
   * Reads a field value from a Vocs search document during MiniSearch indexing and storage.
   *
   * Defaults to MiniSearch object property access. Replaces that behavior on the server during
   * index build, and in the browser when loading the index. Use this to provide virtual fields.
   * The function must be serializable because Vocs sends search config to the browser.
   */
  extractField?: (document: SearchDocument, fieldName: string) => unknown
  /**
   * Converts extracted field values to strings during MiniSearch indexing.
   *
   * Defaults to MiniSearch stringification. Replaces that behavior on the server during index
   * build, and in the browser when loading the index. The function must be serializable because
   * Vocs sends search config to the browser.
   */
  stringifyField?: (fieldValue: unknown, fieldName: string) => string
  /**
   * Splits indexed document field values into terms.
   *
   * Defaults to the Vocs tokenizer, which handles whitespace, punctuation, paths, and camelCase.
   * Replaces the index tokenizer on the server during build and in the browser when loading the
   * serialized index. The function must be serializable because Vocs sends search config to the
   * browser.
   */
  tokenize?: (text: string, fieldName?: string) => string[]
  /**
   * Normalizes or expands terms while MiniSearch indexes document fields.
   *
   * Defaults to MiniSearch lowercase processing. Replaces index-time term processing on the server
   * and in the browser when loading the serialized index. The function must be serializable because
   * Vocs sends search config to the browser.
   */
  processTerm?:
    | ((term: string, fieldName?: string) => string | string[] | null | undefined | false)
    | undefined
  /**
   * Controls MiniSearch automatic vacuuming after discarded documents.
   *
   * Passed through to MiniSearch during server index build and browser index load. Defaults to
   * MiniSearch behavior.
   */
  autoVacuum?: MiniSearchOptions<SearchDocument>['autoVacuum']
  /**
   * Default MiniSearch query options stored on the index.
   *
   * Merges with MiniSearch defaults during index build/load. Vocs still applies `search.query`
   * at runtime, so prefer `search.query` for docs search dialog behavior.
   */
  searchOptions?: MiniSearchSearchOptions
  /**
   * Default MiniSearch auto-suggest options stored on the index.
   *
   * Merges with MiniSearch defaults during index build/load. Vocs does not currently call
   * MiniSearch auto-suggest in its built-in search UI.
   */
  autoSuggestOptions?: MiniSearchSearchOptions
}

export type SearchQueryOptions = MiniSearchSearchOptions & {
  /**
   * Restricts which indexed fields are searched at query runtime.
   *
   * Defaults to every indexed field. Replaces the runtime field set in the browser search dialog.
   */
  fields?: string[]
  /**
   * Filters MiniSearch results at query runtime.
   *
   * Runs in the browser after scoring and before results are shown. The function must be
   * serializable because Vocs sends search config to the browser.
   */
  filter?: MiniSearchSearchOptions['filter']
  /**
   * Per-field score boosts used at query runtime.
   *
   * Merges with the Vocs defaults: `title: 4`, `subtitle: 3`, `text: 2`, `category: 1`,
   * `titles: 1`.
   */
  boost?: MiniSearchSearchOptions['boost']
  /**
   * Per-document score boost used at query runtime.
   *
   * Defaults to Vocs search priority and path-depth boosting. Runs in the browser search dialog.
   * The function must be serializable because Vocs sends search config to the browser.
   */
  boostDocument?: MiniSearchSearchOptions['boostDocument']
  /**
   * Controls whether query terms are combined with `AND` or `OR` at runtime.
   *
   * Defaults to `AND`. Replaces the Vocs default in the browser search dialog.
   */
  combineWith?: MiniSearchSearchOptions['combineWith']
  /**
   * Controls fuzzy matching at query runtime.
   *
   * Defaults to `0.2`. Replaces the Vocs default in the browser search dialog.
   */
  fuzzy?: MiniSearchSearchOptions['fuzzy']
  /**
   * Controls prefix matching at query runtime.
   *
   * Defaults to `true`. Replaces the Vocs default in the browser search dialog.
   */
  prefix?: MiniSearchSearchOptions['prefix']
  /**
   * Relative score weights for fuzzy and prefix matches at query runtime.
   *
   * Uses MiniSearch defaults unless provided. Replaces MiniSearch runtime weights in the browser
   * search dialog.
   */
  weights?: MiniSearchSearchOptions['weights']
  /**
   * Splits search queries into terms at runtime.
   *
   * Defaults to the index tokenizer, which is the Vocs tokenizer unless `search.index.tokenize`
   * overrides it. Runs in the browser search dialog. The function must be serializable because
   * Vocs sends search config to the browser.
   */
  tokenize?: MiniSearchSearchOptions['tokenize']
  /**
   * Normalizes or expands query terms at runtime.
   *
   * Defaults to the index term processor. Runs in the browser search dialog. The function must be
   * serializable because Vocs sends search config to the browser.
   */
  processTerm?: MiniSearchSearchOptions['processTerm']
}

/**
 * Top-level AI configuration. A home for AI-powered features; currently exposes
 * semantic search via {@link AiOptions.retriever}.
 */
export type AiOptions = {
  /**
   * AI search. Additive to the default MiniSearch keyword search: the dialog
   * keeps showing instant keyword results and blends in AI results.
   *
   * Set it to a retriever created by one of:
   *
   * - {@link Retriever.local} — Vocs owns the pipeline: build-time embeddings
   *   packed into a built-in static vector store, queried at runtime.
   *   Self-owned, open-source alternative to a hosted vector DB.
   * - {@link Retriever.cloudflare} / {@link Retriever.from} — retrieval
   *   delegated to a managed backend (e.g. Cloudflare AI Search).
   *
   * Shared runtime/UI knobs (`enabled`, `endpoint`, `hybrid`, `topK`, `ui`) are
   * passed to the constructor. Retrievers hold secrets and are kept server-side
   * only (never serialized to the browser).
   *
   * @example
   * ```ts
   * import { defineConfig, Retriever, Embedding } from 'vocs/config'
   *
   * export default defineConfig({
   *   ai: { retriever: Retriever.local({ embedding: Embedding.openai() }) },
   * })
   * ```
   */
  retriever?: Retriever.Retriever | undefined
}

export type SearchOptions = {
  /**
   * MiniSearch constructor/load options for index build and index load.
   *
   * Use this for changing what gets indexed or stored. Function options run during server index
   * build and browser index load, so they must be serializable.
   */
  index?: SearchIndexOptions
  /**
   * MiniSearch search options for runtime queries.
   *
   * Use this for changing how the built-in search dialog matches, ranks, and filters results.
   * Function options run in the browser and must be serializable.
   */
  query?: SearchQueryOptions
  /**
   * Legacy alias for `search.query.boost`.
   *
   * Merges with Vocs default query boosts.
   */
  boost: NonNullable<MiniSearchSearchOptions['boost']>
  /**
   * Legacy alias for `search.query.boostDocument`.
   *
   * Defaults to Vocs search priority and path-depth boosting.
   */
  boostDocument: NonNullable<MiniSearchSearchOptions['boostDocument']>
  /**
   * Legacy alias for `search.query.combineWith`.
   *
   * Defaults to `AND`.
   */
  combineWith: NonNullable<MiniSearchSearchOptions['combineWith']>
  /**
   * Legacy alias for `search.query.fuzzy`.
   *
   * Defaults to `0.2`.
   */
  fuzzy: NonNullable<MiniSearchSearchOptions['fuzzy']>
  /**
   * Legacy alias for `search.query.prefix`.
   *
   * Defaults to `true`.
   */
  prefix: NonNullable<MiniSearchSearchOptions['prefix']>
}

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
    /**
     * AI-powered features. Currently exposes semantic search via
     * {@link AiOptions.retriever}.
     */
    ai?: AiOptions | undefined
    /**
     * Configuration for the banner fixed to the top of the page.
     */
    banner?:
      | string
      | {
          /** Markdown content displayed in the banner. */
          content: string
          /** Background color of the banner (CSS color value). Overrides variant. */
          backgroundColor?: string | undefined
          /** Whether the banner can be dismissed. Persists in localStorage. @default true */
          dismissable?: boolean | undefined
          /** Unique ID for tracking dismissal in localStorage. If not provided, a hash of the content is used. */
          dismissId?: string | undefined
          /** Minimum height of the banner (CSS value, e.g., '28px'). */
          height?: string | undefined
          /** Optional link (internal or external) the banner navigates to when clicked. */
          href?: string | undefined
          /** Text color of the banner (CSS color value). Overrides variant. */
          textColor?: string | undefined
          /** Visual variant/color scheme of the banner. */
          variant?: 'note' | 'info' | 'warning' | 'danger' | 'tip' | 'success' | undefined
        }
      | undefined
    /**
     * Changelog adapter for fetching release notes.
     * Use `github()` from `vocs/changelog` to fetch from GitHub releases.
     *
     * @example
     * ```ts
     * import { github } from 'vocs/changelog'
     *
     * export default defineConfig({
     *   changelog: github({ repo: 'wevm/viem' }),
     * })
     * ```
     */
    changelog?: Changelog.Adapter | undefined
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
     * Path to the directory to store cache files, relative to `rootDir`.
     *
     * Defaults to `node_modules/.cache/vocs` so the cache is automatically
     * persisted between deployments by hosts like Vercel and Netlify that
     * restore `node_modules/.cache` between builds. Falls back to
     * `.vocs/cache` if `node_modules/` doesn't exist in `rootDir`.
     *
     * @default "node_modules/.cache/vocs"
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
     * Whether the feedback widget is enabled.
     * This is derived from the presence of a feedback adapter.
     */
    feedback: boolean
    /**
     * Feedback adapter (server-side only, not serialized to client).
     * Displays a "Was this helpful?" widget below the page outline.
     *
     * @example
     * ```ts
     * import { Feedback } from 'vocs'
     *
     * export default defineConfig({
     *   feedback: Feedback.slack({
     *     webhookUrl: process.env.SLACK_WEBHOOK_URL,
     *   }),
     * })
     * ```
     */
    _feedback?: Feedback.Adapter | undefined
    /**
     * Private (server-only) config for the self-owned AI search provider,
     * derived from `ai.retriever`. Holds the embedding/vector-store/reranker
     * adapters and is never serialized to the client.
     */
    _localRetriever?: Retriever.LocalPrivateConfig | undefined
    /**
     * Private (server-only) config for the managed AI search provider, derived
     * from `ai.retriever`. Holds the retrieval adapter/secrets and is never
     * serialized to the client.
     */
    _retriever?: Retriever.ManagedPrivateConfig | undefined
    /**
     * Group icons configuration for code block labels.
     * Displays icons next to code block titles based on file extensions and tools.
     */
    groupIcons?:
      | {
          /**
           * Custom icon mappings. Keys are matched as substrings in labels.
           * Values are Iconify identifiers (e.g., `vscode-icons:file-type-mdx`).
           * @example { '.mdx': 'vscode-icons:file-type-mdx' }
           */
          customIcons?: Record<string, string> | undefined
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
     * Controls generated `<head>` tags.
     */
    head?: HeadOptions | undefined
    /**
     * Markdown configuration.
     */
    markdown?: MdxRollup.Options | undefined
    /**
     * MCP (Model Context Protocol) server configuration.
     * Enables LLMs to navigate documentation and source code.
     *
     * @example
     * ```ts
     * import { McpSource } from 'vocs'
     *
     * export default defineConfig({
     *   mcp: {
     *     enabled: true,
     *     sources: [
     *       McpSource.github({ name: 'viem', repo: 'wevm/viem' }),
     *     ],
     *   },
     * })
     * ```
     */
    mcp?:
      | {
          /** Enable MCP server endpoint at `/api/mcp`. */
          enabled?: boolean | undefined
          /** Source code adapters for navigating codebases. */
          sources?: readonly McpSource.Adapter[] | undefined
        }
      | undefined
    /**
     * OG Image URL template. Can be a string or a function that returns a URL based on the path.
     *
     * Template variables: `%logo`, `%title`, `%description`
     *
     * @example
     * // Static URL for all pages
     * ogImageUrl: '/api/og?title=%title&description=%description'
     *
     * @example
     * // Dynamic URL based on path
     * ogImageUrl: (path, { baseUrl }) => `${baseUrl}/api/og?title=%title&path=${path}`
     */
    ogImageUrl?:
      | string
      | ((path: string, context: { baseUrl?: string | undefined }) => string)
      | undefined
    /**
     * OpenAPI integrations. Each entry mounts an isolated, auto-generated API
     * reference section (with its own sidebar) at the given `path`.
     *
     * @example
     * ```ts
     * export default defineConfig({
     *   openapi: [
     *     { spec: './openapi.yaml', path: '/api' },
     *   ],
     * })
     * ```
     */
    openapi?: readonly OpenApi.SiteConfig[] | undefined
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
     *
     * `search.index` customizes MiniSearch index construction/loading. `search.query`
     * customizes runtime searches in the browser. Legacy top-level query options such as
     * `boost`, `fuzzy`, `prefix`, `combineWith`, and `boostDocument` remain supported.
     *
     * Custom functions must be serializable because Vocs sends search config to the client.
     *
     * @example
     * ```ts
     * export default defineConfig({
     *   search: {
     *     index: {
     *       fields: ['title', 'text', 'path'],
     *       extractField(document, fieldName) {
     *         if (fieldName === 'path') return document.href
     *         return document[fieldName as keyof typeof document]
     *       },
     *     },
     *   },
     * })
     * ```
     *
     * @example
     * ```ts
     * export default defineConfig({
     *   search: {
     *     index: { storeFields: ['href'] },
     *     query: {
     *       fields: ['title', 'text'],
     *       boost: { title: 6, text: 1 },
     *       fuzzy: false,
     *       prefix: false,
     *       processTerm: (term) => term.toLowerCase(),
     *     },
     *   },
     * })
     * ```
     */
    search: MaybePartial<partial, SearchOptions>
    /**
     * Controls generated `sitemap.xml` entries.
     */
    sitemap?: false | SitemapOptions | undefined
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
    titleTemplate: TitleTemplate
    /**
     * Navigation displayed on the top.
     */
    topNav?: readonly TopNav.Item[] | undefined
    /**
     * Whether Vocs redirects trailing-slash page URLs to their no-slash form
     * (e.g. `/about/` → `/about` via a 308).
     *
     * Disable this when an upstream host (e.g. a reverse proxy or CDN) owns
     * trailing-slash canonicalization. When disabled, Vocs internally
     * normalizes `/foo/` to `/foo` for routing instead of emitting a redirect,
     * which avoids redirect loops when the upstream adds trailing slashes.
     *
     * @default true
     */
    trailingSlashRedirect: boolean
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

export type Layout = 'full' | 'minimal' | 'blank'

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
   * Page layout.
   * - `full`: Sidebar + top nav + content + outline (default)
   * - `minimal`: Top nav + centered content + outline (no sidebar)
   * - `blank`: Just content (no top nav, sidebar, or outline)
   * @default "full"
   */
  layout?: Layout | undefined
  /**
   * Content layout options.
   */
  content?:
    | {
        /**
         * Content width.
         * - `default`: centered and constrained to the readable measure (default)
         * - `full`: spans the full available width (no centering gutter); used by
         *   full-bleed pages such as the OpenAPI reference.
         * @default "default"
         */
        width?: 'default' | 'full' | undefined
      }
    | undefined
  /**
   * Whether to show the outline, or the depth of headings to show.
   * Set to `false` to hide the outline, or a number to limit depth.
   * @default true
   */
  outline?: boolean | number | undefined
  /** Robots directive (e.g., "noindex", "nofollow"). */
  robots?: string | undefined
  /**
   * Whether to show the Ask AI button.
   * @default true
   */
  showAskAi?: boolean | undefined
  /**
   * Whether to show the banner.
   * @default true
   */
  showBanner?: boolean | undefined
  /**
   * Whether to show the search box.
   * @default true
   */
  showSearch?: boolean | undefined
  /**
   * Whether to show the feedback widget.
   * @default true
   */
  showFeedback?: boolean | undefined
  /**
   * Whether to show the logo in the top navigation.
   * @default true
   */
  showLogo?: boolean | undefined
  /**
   * Whether to show the sidebar.
   * Overrides the default behavior based on layout.
   */
  showSidebar?: boolean | undefined
  /**
   * Whether to show the top navigation.
   * Overrides the default behavior based on layout.
   */
  showTopNav?: boolean | undefined
  /** Additional metadata for the page. */
  [key: string]: unknown
}

export function define(config: define.Options = {}): Config {
  const {
    accentColor = 'light-dark(black, white)',
    ai: aiOptions,
    banner,
    basePath = '/',
    cacheDir,
    changelog,
    checkDeadlinks = true,
    codeHighlight,
    colorScheme = 'light dark',
    description,
    head,
    iconUrl,
    logoUrl,
    markdown,
    mcp,
    ogImageUrl,
    openapi,
    outDir = 'dist',
    redirects,
    renderStrategy = 'dynamic',
    rootDir = process.cwd(),
    search,
    sidebar,
    sitemap,
    socials,
    srcDir = 'src',
    title = 'Docs',
    titleTemplate = `%s – ${title}`,
    topNav,
    trailingSlashRedirect = true,
    twoslash,
  } = config

  const pagesDir = 'pages'

  const baseUrl = (() => {
    if (!config.baseUrl) return undefined
    let url = config.baseUrl.replace(/\/$/, '')
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }
    return url
  })()

  // `ai.retriever` selects one semantic provider (self-owned vector store or a
  // managed retriever). Normalize it into the internal local/managed inputs.
  //
  // Resolution must be idempotent: `define` can run twice (once via
  // `defineConfig` in the user's config, then again in `Config.resolve`). On the
  // second pass the private config already exists and `ai.retriever` already holds
  // the resolved public config, so we skip re-normalizing (which would otherwise
  // see no adapter and disable semantic search).
  const existingLocal = (config as { _localRetriever?: Retriever.LocalPrivateConfig })
    ._localRetriever
  const existingRetriever = (config as { _retriever?: Retriever.ManagedPrivateConfig })._retriever
  const resolvedAlready = Boolean(existingLocal || existingRetriever)
  const ai = resolvedAlready ? {} : Retriever.normalize(aiOptions?.retriever)
  const localResolved = existingLocal ? undefined : Retriever.resolveLocal(ai.local, { basePath })
  const retrieverResolved = existingRetriever
    ? undefined
    : Retriever.resolveManaged(ai.managed, { basePath })
  // Exactly one provider resolves; both serialize to the same public shape.
  const aiPublic = resolvedAlready
    ? (aiOptions?.retriever as Retriever.PublicConfig | undefined)
    : (localResolved?.public ?? retrieverResolved?.public)
  // The public config shape differs from the `Retriever.Retriever` accepted on the way in.
  const aiResolved = (aiPublic ? { retriever: aiPublic } : undefined) as AiOptions | undefined

  return {
    accentColor,
    ai: aiResolved,
    banner: banner
      ? {
          dismissable: true,
          variant: 'info',
          ...(typeof banner === 'string' ? { content: banner } : banner),
        }
      : undefined,
    baseUrl,
    basePath,
    cacheDir: path.resolve(rootDir, cacheDir ?? resolveDefaultCacheDir(rootDir)),
    changelog,
    checkDeadlinks,
    codeHighlight: {
      ...codeHighlight,
      langAlias: {
        sol: 'solidity',
        ...(codeHighlight?.langAlias ?? {}),
      },
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
    feedback: !!(config.feedback || (config as { _feedback?: unknown })._feedback),
    _feedback: (config as { _feedback?: Feedback.Adapter })._feedback ?? config.feedback,
    _localRetriever: existingLocal ?? localResolved?.private,
    _retriever: existingRetriever ?? retrieverResolved?.private,
    groupIcons: config.groupIcons,
    head,
    iconUrl,
    logoUrl,
    markdown,
    mcp,
    ogImageUrl,
    openapi: openapi?.map((entry) => resolveOpenApi(entry)),
    outDir,
    pagesDir,
    redirects,
    renderStrategy,
    rootDir,
    search: (() => {
      const query = search?.query ?? {}
      const boostDocument =
        query.boostDocument ??
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
        })

      return {
        ...search,
        query: {
          ...query,
          boostDocument,
          combineWith: query.combineWith ?? search?.combineWith ?? 'AND',
          fuzzy: query.fuzzy ?? search?.fuzzy ?? 0.2,
          prefix: query.prefix ?? search?.prefix ?? true,
          boost: {
            title: 4,
            subtitle: 3,
            text: 2,
            category: 1,
            titles: 1,
            ...search?.boost,
            ...query.boost,
          },
        },
        boostDocument,
        combineWith: query.combineWith ?? search?.combineWith ?? 'AND',
        fuzzy: query.fuzzy ?? search?.fuzzy ?? 0.2,
        prefix: query.prefix ?? search?.prefix ?? true,
        boost: {
          title: 4,
          subtitle: 3,
          text: 2,
          category: 1,
          titles: 1,
          ...search?.boost,
          ...query.boost,
        },
      }
    })(),
    sidebar,
    sitemap,
    socials,
    srcDir,
    title,
    titleTemplate,
    topNav,
    trailingSlashRedirect,
    twoslash,
  }
}

export declare namespace define {
  export type Options = UnionOmit<
    Config<true>,
    'pagesDir' | 'feedback' | '_feedback' | '_localRetriever' | '_retriever'
  > & {
    /**
     * Feedback adapter configuration.
     * Displays a "Was this helpful?" widget below the page outline.
     */
    feedback?: Feedback.Adapter | undefined
  }
}

export function getConfigFile(options: getConfigFile.Options = {}): string | undefined {
  const { rootDir = process.cwd() } = options

  return fs.globSync('vocs.config.{ts,js,mjs,mts}', { cwd: rootDir })[0]
}

/**
 * Resolves the default cache directory.
 *
 * Prefers `node_modules/.cache/vocs` so deploy targets (Vercel, Netlify, etc.)
 * that automatically restore `node_modules/.cache` between builds keep the
 * cache warm. Falls back to `.vocs/cache` if `node_modules/` doesn't exist
 * in `rootDir` (e.g. unusual setups, monorepos with non-standard hoisting).
 */
function resolveDefaultCacheDir(rootDir: string): string {
  if (fs.existsSync(path.join(rootDir, 'node_modules'))) return 'node_modules/.cache/vocs'
  return '.vocs/cache'
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
    const resolved = (await import(/* @vite-ignore */ configPath)).default as define.Options
    return define({ ...resolved, rootDir })
  }

  const configFile = getConfigFile({ rootDir })
  if (!configFile) return define({})

  // Resolved via a non-literal specifier so bundlers (esbuild/Wrangler) don't
  // statically pull Vite (and its esbuild/lightningcss/rollup deps) into edge
  // consumers that only import `Config.define` through `vocs/server`. This branch
  // only ever runs in Node (dev/CLI/config loading), where the runtime import
  // resolves normally.
  const viteSpecifier = 'vite'
  const vite = await import(/* @vite-ignore */ viteSpecifier)
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
