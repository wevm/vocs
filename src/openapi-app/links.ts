import type { Payload } from '../internal/openapi/app.js'
import { inferMount, join, knownRoutes } from '../internal/openapi/app.js'

export { join }

/**
 * Section-space routing for the prebuilt OpenAPI app.
 *
 * All internal links (sidebar, endpoints, search) are authored as absolute
 * "section routes" prefixed by the spec's `path` (default `/`). The app can be
 * mounted at any location by the host server (e.g. Hono `app.route('/docs',
 * ref)`), so at runtime the actual mount prefix is inferred from the current URL
 * and prepended when producing real `href`s.
 *
 * This is the pure, DOM-free core; {@link file://./waku.tsx the `waku` shim}
 * wraps it with React reactivity and history wiring.
 */
export type Router = {
  /** The spec mount base (e.g. `/` or `/api`). */
  base: string
  /** The inferred host mount prefix (e.g. `/docs`, or `''`). */
  mount: string
  /** Known section routes (intro, per-group, per-page). */
  routes: string[]
  /** Maps a section route/href to a real, mount-prefixed href. */
  href: (sectionPath: string) => string
  /** Resolves a real pathname to a section route + hash. */
  resolve: (pathname: string, hash?: string) => { route: string; hash: string }
}

/** Creates a {@link Router} from the embedded payload + current location. */
export function createRouter(payload: Payload, pathname: string): Router {
  const base = payload.ir.path || '/'
  const routes = knownRoutes(payload)
  const mount = inferMount(pathname, routes)

  function href(sectionPath: string): string {
    const [route, hash] = splitHash(sectionPath)
    const full = `${mount}${route === '/' ? '' : route}` || '/'
    return `${stripTrailingSlash(full) || '/'}${hash}`
  }

  function resolve(pathnameToResolve: string, hash = ''): { route: string; hash: string } {
    const rel = stripTrailingSlash(stripPrefix(pathnameToResolve, mount)) || '/'
    // Find the matching known route (default to intro).
    const match = routes.includes(rel) ? rel : base === '/' ? '/' : base
    return { route: match, hash }
  }

  return { base, mount, routes, href, resolve }
}

/** Splits a path into `[path, '#hash']` (hash includes the `#`, or `''`). */
function splitHash(value: string): [string, string] {
  const index = value.indexOf('#')
  if (index === -1) return [value, '']
  return [value.slice(0, index), value.slice(index)]
}

function stripTrailingSlash(value: string): string {
  return value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value
}

function stripPrefix(value: string, prefix: string): string {
  return prefix && value.startsWith(prefix) ? value.slice(prefix.length) || '/' : value
}
