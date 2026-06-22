/**
 * Shared types for the prebuilt OpenAPI app (the `Handler.openApi` server
 * handler and the static browser bundle it serves).
 *
 * This module is intentionally free of Node and DOM dependencies so it can be
 * imported by both the server handler and the client entry.
 */

import type { Config } from '../config.js'
import type { SidebarItem } from '../sidebar.js'
import { normalizePath } from './openapi.js'
import type { Ir } from './parser.js'

/**
 * A block of rendered page content. Guide/override pages are compiled on the
 * server into an ordered list of blocks so embedded `<OpenApi.Endpoints />`
 * components can be re-hydrated as real React on the client (rather than
 * inlined as static HTML).
 */
export type PageBlock =
  | { type: 'html'; html: string }
  | { type: 'endpoints'; path?: string | undefined }

/**
 * A compiled consumer-authored page, keyed by its section-relative route.
 *
 * - `path === '/'` overrides the landing/intro content.
 * - `path === '/<group>'` overrides a category header.
 * - any other `path` is a standalone guide page.
 */
export type CompiledPage = {
  /** Section-relative route (normalized, leading slash, no trailing slash). */
  path: string
  /** Document title (frontmatter `title` or first `# heading`). */
  title?: string | undefined
  /** Subtitle Markdown rendered below the title on guide pages. */
  description?: string | undefined
  /** Ordered content blocks. */
  blocks: PageBlock[]
  /**
   * Raw authored Markdown (frontmatter + ESM import/export lines stripped), used
   * to serve the page's `.md` / agent-facing version. Absent for trait pages
   * compiled from a description that is already the body.
   */
  markdown?: string | undefined
}

/**
 * The JSON payload embedded in the standalone HTML shell and consumed by the
 * browser bundle to render the reference entirely client-side.
 */
export type Payload = {
  /** Parsed OpenAPI IR. */
  ir: Ir
  /** Document title (spec `info.title`). */
  title: string
  /** Computed sidebar (extras + generated items). */
  sidebar: SidebarItem<true>[]
  /** Compiled override/guide pages. */
  pages: CompiledPage[]
  /**
   * Serialized Vocs config that backs `virtual:vocs/config` in the browser
   * bundle, so the prebuilt app renders the real Vocs layout/chrome. Functions
   * are serialized via {@link file://../config-serializer.ts config-serializer};
   * the client deserializes them on load.
   */
  config: Config
}

/** Joins a section base path with a section-relative sub-path. */
export function join(base: string, sub: string): string {
  const b = base === '/' ? '' : base
  if (!sub || sub === '/') return b || '/'
  return `${b}${sub.startsWith('/') ? sub : `/${sub}`}`
}

/**
 * The set of known section routes for a payload: the intro (the spec `path`),
 * one per category, and one per compiled page.
 */
export function knownRoutes(payload: Payload): string[] {
  const base = payload.ir.path || '/'
  const routes = new Set<string>()
  routes.add(base === '/' ? '/' : normalizePath(base))
  for (const group of payload.ir.groups) routes.add(join(base, `/${group.id}`))
  for (const page of payload.pages) routes.add(join(base, page.path))
  return [...routes]
}

/**
 * Infers the host mount prefix from a request pathname: the longest known
 * section route that is a path-suffix of `pathname` is stripped; whatever
 * precedes it is the mount (e.g. `/docs/pets` with route `/pets` → `/docs`).
 * Falls back to treating the whole pathname as the mount (the intro page).
 */
export function inferMount(pathname: string, routes: string[]): string {
  const path = stripTrailingSlash(pathname)
  let mount = ''
  let best = -1
  for (const route of routes) {
    if (route === '/') continue
    if (path === route || path.endsWith(route)) {
      const prefix = path.slice(0, path.length - route.length)
      if (route.length > best && (prefix === '' || prefix.startsWith('/'))) {
        best = route.length
        mount = prefix
      }
    }
  }
  // No group/page route matched: we're on the intro/landing page, so the whole
  // pathname is the mount. A root mount (`/`) has no prefix, though — return ''
  // so callers build `/group` rather than `//group` (a protocol-relative URL the
  // browser reads as `http://group/`).
  if (best === -1) return path === '/' ? '' : path
  return mount
}

function stripTrailingSlash(value: string): string {
  return value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value
}
