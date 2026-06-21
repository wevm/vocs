/**
 * OpenAPI integration config.
 *
 * Mounts an isolated, auto-generated API reference section in the docs from an
 * OpenAPI spec. Use {@link from} to define an entry in `vocs.config.ts`.
 */

import type * as VocsConfig from '../config.js'
import type { SidebarItem } from '../sidebar.js'

/**
 * Spec source.
 *
 * - A file path relative to the project root (e.g. `./openapi.yaml`).
 * - A URL (e.g. `https://example.com/openapi.json`).
 * - Raw JSON/YAML content.
 * - An inline OpenAPI document object.
 */
export type Spec = string | Record<string, unknown>

/**
 * Extra sidebar items to add around the auto-generated section.
 *
 * These are typically links to consumer-authored override/guide pages mounted
 * under the same `path` (e.g. `pages/api/auth.mdx`).
 */
export type SidebarExtras = {
  /** Items prepended above the generated `Introduction`/categories. */
  top?: SidebarItem[] | undefined
  /** Items appended below the generated categories. */
  bottom?: SidebarItem[] | undefined
}

/**
 * A consumer-authored `.md`/`.mdx` page mounted into an OpenAPI section.
 *
 * In the Vite/site integration these are discovered automatically by the file
 * router (e.g. `pages/api/auth.mdx`). In the standalone server handler
 * ({@link file://./../../server/handlers.ts `Handler.openApi`}) — which has no
 * filesystem router — they are supplied explicitly so override/guide content can
 * still be rendered.
 *
 * - `path` is the route relative to the section mount (e.g. `/` overrides the
 *   landing intro, `/auth` is a guide page, `/<group>` overrides a category
 *   header).
 * - `file` is the path to the `.md`/`.mdx` source, resolved against the handler
 *   `rootDir` (default `process.cwd()`).
 */
export type Page = {
  path: string
  file: string
}

export type Config = {
  /**
   * OpenAPI spec source: file path, URL, raw content, or inline object.
   */
  spec: Spec
  /**
   * Mount path for the generated API reference section.
   *
   * The section gets its own isolated sidebar scoped to this path.
   *
   * Required for the Vite/site integration. Optional for the standalone
   * {@link file://./../../server/handlers.ts `Handler.openApi`} handler (the
   * Hono mount provides the location; `path` only seeds generated link bases and
   * defaults to `/`).
   *
   * @example "/api"
   */
  path?: string | undefined
  /**
   * Extra sidebar items to add around the auto-generated section (e.g. links to
   * consumer-authored guide pages mounted under `path`).
   *
   * @example
   * ```ts
   * sidebar: {
   *   top: [{ text: 'Authentication', link: '/api/auth' }],
   *   bottom: [{ text: 'Errors', link: '/api/errors' }],
   * }
   * ```
   */
  sidebar?: SidebarExtras | undefined
  /**
   * Consumer-authored `.md`/`.mdx` override/guide pages.
   *
   * Only used by the standalone {@link file://./../../server/handlers.ts
   * `Handler.openApi`} handler — the Vite/site integration discovers these via
   * the file router instead.
   */
  pages?: Page[] | undefined
  /**
   * Vocs config passthrough for the standalone {@link
   * file://./../../server/handlers.ts `Handler.openApi`} handler.
   *
   * The handler renders the real Vocs layout, so these options customize the
   * chrome (theme, top navigation, logo, socials, …) exactly like a
   * `vocs.config.ts`.
   *
   * `title` and `description` default to the spec's `info.title`/`info.description`
   * but can be overridden here. `sidebar` is derived from the generated section
   * (plus the `sidebar` config above) and cannot be set here.
   *
   * @example
   * ```ts
   * vocs: {
   *   title: 'Acme Docs',
   *   logoUrl: '/logo.svg',
   *   theme: { accentColor: '#7c3aed' },
   *   topNav: [{ text: 'Home', link: 'https://acme.com' }],
   * }
   * ```
   */
  vocs?: Omit<VocsConfig.define.Options, 'sidebar' | 'openapi'> | undefined
}

/**
 * Config for the Vite/site integration, where `path` is required (it scopes the
 * generated sidebar and routes).
 */
export type SiteConfig = Config & {
  path: string
}

/**
 * Defines an OpenAPI integration entry.
 *
 * @example
 * ```ts
 * import { OpenApi } from 'vocs/config'
 *
 * export default defineConfig({
 *   openapi: [
 *     OpenApi.from({ spec: './openapi.yaml', path: '/api' }),
 *   ],
 * })
 * ```
 */
export function from(config: from.Options): SiteConfig {
  const { spec, path, sidebar, pages } = config

  if (!spec) throw new Error('[vocs] `openapi` entry is missing a `spec`.')
  if (!path) throw new Error('[vocs] `openapi` entry is missing a `path`.')

  return {
    spec,
    path: normalizePath(path),
    ...(sidebar ? { sidebar } : {}),
    ...(pages ? { pages } : {}),
  }
}

export declare namespace from {
  type Options = SiteConfig
}

/**
 * Normalizes a mount path: ensures a leading slash and strips any trailing
 * slash (except for the root `/`).
 */
export function normalizePath(path: string): string {
  let normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized.length > 1 && normalized.endsWith('/')) normalized = normalized.slice(0, -1)
  return normalized
}
