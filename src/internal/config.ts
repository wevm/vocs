import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Options as mdx_Options } from '@mdx-js/rollup'
import type { ExactPartial } from '../types.js'
import type { rehypeShiki } from './mdx.js'
import type { twoslash } from './shiki-transformers.js'

export type Config = {
  // /**
  //  * Whether or not to show the AI call-to-action dropdown on docs pages (ie. "Open in ChatGPT"),
  //  * as well as any configuration.
  //  */
  // aiCta?:
  //   | boolean
  //   | {
  //       /**
  //        * Query for the LLM.
  //        */
  //       query: (p: { location: string }) => string
  //     }
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
  // /**
  //  * Directory to store cache files.
  //  *
  //  * @default "node_modules/vocs/.cache"
  //  */
  // cacheDir?: string
  // /**
  //  * Whether or not to check for dead links in the documentation.
  //  *
  //  * - `true`: Enable dead link checking and throw errors on dead links.
  //  * - `false`: Disable dead link checking.
  //  * - `"warn"`: Enable dead link checking but only warn instead of throwing errors.
  //  *
  //  * @default true
  //  */
  // checkDeadlinks?: boolean | 'warn'
  /**
   * General description for the documentation.
   */
  description?: string | undefined
  // /**
  //  * Edit location for the documentation.
  //  */
  // editLink?: Normalize<EditLink>
  // /**
  //  * Base font face.
  //  *
  //  * @default { google: "Inter" }
  //  */
  // font?: Normalize<Font<parsed>>
  // /**
  //  * Additional tags to include in the `<head>` tag of the page HTML.
  //  */
  // head?:
  //   | ReactElement
  //   | { [path: string]: ReactElement }
  //   | ((params: { path: string }) => ReactElement | Promise<ReactElement>)
  /**
   * Icon URL.
   */
  iconUrl?: string | { light: string; dark: string } | undefined
  /**
   * Logo URL.
   */
  logoUrl?: string | { light: string; dark: string } | undefined
  /**
   * OG Image URL. `null` to disable.
   *
   * Template variables: `%logo`, `%title`, `%description`
   *
   * @default "https://vocs.dev/api/og?logo=%logo&title=%title&description=%description"
   */
  ogImageUrl?: string | { [path: string]: string } | undefined
  // /**
  //  * Outline footer.
  //  */
  // outlineFooter?: ReactElement
  /**
   * Markdown configuration.
   */
  markdown?:
    | (mdx_Options & {
        codeHighlight?: Omit<rehypeShiki.Options, 'twoslash'> | undefined
      })
    | undefined
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
  // /**
  //  * Configuration for docs search.
  //  */
  // search?: Normalize<Search>
  // /**
  //  * Navigation displayed on the sidebar.
  //  */
  // sidebar?: Normalize<Sidebar>
  // /**
  //  * Social links displayed in the top navigation.
  //  */
  // socials?: Normalize<Socials<parsed>>
  // /**
  //  * Set of sponsors to display on MDX directives and (optionally) the sidebar.
  //  */
  // sponsors?: SponsorSet[]
  /**
   * The source directory relative to root.
   * @default "src"
   */
  srcDir: string
  // /**
  //  * Theme configuration.
  //  */
  // theme?: Normalize<Theme<parsed, colorScheme>>
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
  // /**
  //  * Navigation displayed on the top.
  //  */
  // topNav?: Normalize<TopNav<parsed>>
  /**
   * TwoSlash configuration. Set to `false` to disable.
   */
  twoslash?: twoslash.Options | false | undefined
}

export function define(config: define.Options = {}): Config {
  const {
    basePath = '/',
    description,
    markdown,
    outDir = 'dist',
    srcDir = 'src',
    title = 'Docs',
    titleTemplate = `%s – ${title}`,
    twoslash,
  } = config
  return {
    basePath,
    description,
    markdown,
    outDir,
    pagesDir: 'pages',
    srcDir,
    title,
    titleTemplate,
    twoslash,
  }
}

export declare namespace define {
  export type Options = ExactPartial<Omit<Config, 'pagesDir'>>
}

export async function resolve(options: resolve.Options = {}): Promise<Config> {
  const { root = process.cwd() } = options

  const configFile = fs.globSync('vocs.config.{ts,js,mjs,mts}', { cwd: root })[0]
  if (!configFile) return define()

  const mod = await import(path.join(root, configFile) + '?t=' + Date.now())
  return define(mod.default ?? mod)
}

declare namespace resolve {
  export type Options = {
    root?: string | undefined
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

export function serialize(config: Config) {
  return JSON.stringify(serializeFunctions(config))
}

export function deserialize(config: string) {
  return deserializeFunctions(JSON.parse(config))
}

// biome-ignore lint/suspicious/noExplicitAny: _
export function serializeFunctions(value: any, key?: string): any {
  if (Array.isArray(value)) {
    return value.map((v) => serializeFunctions(v))
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).reduce((acc, key) => {
      if (key[0] === '_') return acc
      acc[key] = serializeFunctions(value[key], key)
      return acc
      // biome-ignore lint/suspicious/noExplicitAny: _
    }, {} as any)
  }
  if (typeof value === 'function') {
    let serialized = value.toString()
    if (key && (serialized.startsWith(key) || serialized.startsWith(`async ${key}`))) {
      serialized = serialized.replace(key, 'function')
    }
    return `_vocs-fn_${serialized}`
  }
  return value
}

// biome-ignore lint/suspicious/noExplicitAny: _
export function deserializeFunctions(value: any): any {
  if (Array.isArray(value)) {
    return value.map(deserializeFunctions)
  }
  if (typeof value === 'object' && value !== null) {
    // biome-ignore lint/suspicious/noExplicitAny: _
    return Object.keys(value).reduce((acc: any, key) => {
      acc[key] = deserializeFunctions(value[key])
      return acc
    }, {})
  }
  if (typeof value === 'string' && value.includes('_vocs-fn_')) {
    return new Function(`return ${value.slice(9)}`)()
  }
  return value
}

export const deserializeFunctionsStringified = `
  function deserializeFunctions(value) {
    if (Array.isArray(value)) {
      return value.map(deserializeFunctions)
    } else if (typeof value === 'object' && value !== null) {
      return Object.keys(value).reduce((acc, key) => {
        acc[key] = deserializeFunctions(value[key])
        return acc
      }, {})
    } else if (typeof value === 'string' && value.includes('_vocs-fn_')) {
      return new Function(\`return \${value.slice(9)}\`)()
    } else {
      return value
    }
  }
`
