import type { Config } from '../config.js'
import type { SidebarItem } from '../sidebar.js'
import { type Ir, parse } from './parser.js'
import * as Sidebar from './sidebar.js'

type Specs = Record<string, Ir>

let cache: Specs | null = null
let building: Promise<Specs> | null = null

/**
 * Parses all configured OpenAPI specs into IRs, memoized across plugins and
 * Vite environments. Call {@link invalidate} to force a re-parse (e.g. when a
 * local spec file changes).
 */
export async function build(config: Config): Promise<Specs> {
  if (cache) return cache
  if (building) return building

  building = (async () => {
    const next: Specs = {}
    for (const entry of config.openapi ?? [])
      next[entry.path] = await parse(entry, { rootDir: config.rootDir })
    cache = next
    building = null
    return next
  })()

  return building
}

/** Returns the cached specs, or `null` if not yet built. */
export function peek(): Specs | null {
  return cache
}

/** Clears the cache so the next {@link build} re-parses. */
export function invalidate(): void {
  cache = null
  building = null
}

/**
 * Returns the OpenAPI-generated sidebars keyed by mount path, derived from the
 * cached IRs. Empty if specs haven't been built yet or none are configured.
 */
export function sidebars(
  config?: Config,
): Record<string, { backLink: boolean; items: SidebarItem<true>[] }> {
  const result: Record<string, { backLink: boolean; items: SidebarItem<true>[] }> = {}
  if (!cache) return result
  for (const [path, ir] of Object.entries(cache)) {
    const entry = config?.openapi?.find((entry) => entry.path === path)
    const collapsed = entry?.sidebar?.collapsed
    const intro = entry?.sidebar?.intro
    const flatten = entry?.sidebar?.flatten
    const backLink = entry?.sidebar?.backLink ?? true
    result[path] = { backLink, items: Sidebar.toSidebar(ir, { collapsed, intro, flatten }) }
  }
  return result
}

/**
 * Merges OpenAPI-generated sidebars into a user's `sidebar` config.
 *
 * Returns the original config unchanged when no OpenAPI sidebars exist.
 * Array-form sidebars are converted to path-keyed form (under `/`) so the
 * OpenAPI section can be scoped to its own mount path.
 *
 * Per-entry `sidebar.top` / `sidebar.bottom` items (links to consumer guide
 * pages mounted under the same path) are prepended/appended around the
 * generated items. Never mutates inputs.
 */
export function mergeSidebar(config: Config): Config {
  const generated = sidebars(config)
  if (Object.keys(generated).length === 0) return config

  const userSidebar = config.sidebar

  let merged: Record<string, unknown>
  if (!userSidebar) merged = {}
  else if (Array.isArray(userSidebar)) merged = { '/': userSidebar }
  else merged = { ...userSidebar }

  for (const [path, sidebar] of Object.entries(generated)) {
    const entry = config.openapi?.find((candidate) => candidate.path === path)
    const top = entry?.sidebar?.top ?? []
    const bottom = entry?.sidebar?.bottom ?? []
    merged[path] = { ...sidebar, items: [...top, ...sidebar.items, ...bottom] }
  }

  return { ...config, sidebar: merged as Config['sidebar'] }
}
