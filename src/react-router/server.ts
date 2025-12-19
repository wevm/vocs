/**
 * Fork of https://github.com/remix-run/react-router/blob/main/packages/react-router-fs-routes/index.ts
 * Additional changes:
 * - Support for sibling TSX/MDX routes
 * - Fallback routes
 * - Alternative import compatible escape characters
 */

import './fallback-routes/$.js'
import './fallback-routes/llms!.txt!.js'
import './fallback-routes/llms-full!.txt!.js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { getAppDirectory, type RouteConfigEntry } from '@react-router/dev/routes'

/**
 * Creates route config from the file system using a convention that matches
 * [Remix v2's route file
 * naming](https://v2.remix.run/docs/file-conventions/routes), for use
 * within `routes.ts`.
 */
export async function fileRoutes(
  options: {
    /**
     * The directory containing file system routes, relative to the app directory.
     * Defaults to `"./routes"`.
     */
    rootDirectory?: string | undefined
  } = {},
): Promise<Exact<RouteConfigEntry>[]> {
  const { rootDirectory: userRootDirectory = 'routes' } = options
  const appDirectory = getAppDirectory()
  const rootDirectory = path.resolve(appDirectory, userRootDirectory)
  const relativeRootDirectory = path.relative(appDirectory, rootDirectory)
  const prefix = normalizeSlashes(relativeRootDirectory)

  const routes = fs.existsSync(rootDirectory) ? flatRoutesImpl(appDirectory, prefix) : {}
  const fallbackRoutes = flatRoutesImpl(import.meta.dirname, 'fallback-routes', false)

  for (const [id, route] of Object.entries(fallbackRoutes)) {
    const mainRouteId = id.replace(/^fallback-routes/, prefix)
    if (!routes[mainRouteId]) {
      routes[mainRouteId] = {
        ...route,
        id: mainRouteId,
      }
    }
  }

  // Make MDX routes children of the _docs layout
  const docsLayoutId = `${prefix}/_docs`
  if (routes[docsLayoutId]) {
    for (const [id, route] of Object.entries(routes)) {
      if (id === docsLayoutId) continue
      if (route.file.endsWith('.mdx') || route.file.endsWith('.md')) {
        if (route.parentId === 'root') {
          route.parentId = docsLayoutId
        }
      }
    }
  }

  return routeManifestToRouteConfig(routes)
}

export interface RouteManifestEntry {
  path?: string | undefined
  index?: boolean | undefined
  caseSensitive?: boolean | undefined
  id: string
  parentId?: string | undefined
  file: string
}

export interface RouteManifest {
  [routeId: string]: RouteManifestEntry
}

export function routeManifestToRouteConfig(
  routeManifest: RouteManifest,
  rootId = 'root',
): Exact<RouteConfigEntry>[] {
  const routeConfigById: {
    [id: string]: Omit<Exact<RouteConfigEntry>, 'id'> &
      Required<Pick<Exact<RouteConfigEntry>, 'id'>>
  } = {}

  for (const id in routeManifest) {
    const route = routeManifest[id]
    if (!route) continue
    routeConfigById[id] = {
      id: route.id,
      file: route.file,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive,
    }
  }

  const routeConfig: Exact<RouteConfigEntry>[] = []

  for (const id in routeConfigById) {
    const route = routeConfigById[id]
    if (!route) continue
    if (!route.id) continue

    const parentId = routeManifest[route.id]?.parentId
    if (parentId === rootId) {
      routeConfig.push(route)
    } else {
      const parentRoute = parentId && routeConfigById[parentId]
      if (parentRoute) {
        parentRoute.children = parentRoute.children || []
        parentRoute.children.push(route)
      }
    }
  }

  return routeConfig
}

export const routeModuleExts = ['.js', '.jsx', '.ts', '.tsx', '.md', '.mdx']

export const paramPrefixChar = '$' as const
export const escapeStart = '[' as const
export const escapeEnd = ']' as const
export const escapeChar = '!' as const

export const optionalStart = '(' as const
export const optionalEnd = ')' as const

const PrefixLookupTrieEndSymbol = Symbol('PrefixLookupTrieEndSymbol')
type PrefixLookupNode = {
  [key: string]: PrefixLookupNode
} & Record<typeof PrefixLookupTrieEndSymbol, boolean>

class PrefixLookupTrie {
  root: PrefixLookupNode = {
    [PrefixLookupTrieEndSymbol]: false,
  }

  add(value: string) {
    if (!value) throw new Error('Cannot add empty string to PrefixLookupTrie')

    let node = this.root
    for (const char of value) {
      if (!node[char]) {
        node[char] = {
          [PrefixLookupTrieEndSymbol]: false,
        }
      }
      node = node[char]
    }
    node[PrefixLookupTrieEndSymbol] = true
  }

  findAndRemove(prefix: string, filter: (nodeValue: string) => boolean): string[] {
    let node = this.root
    for (const char of prefix) {
      if (!node[char]) return []
      node = node[char]
    }

    return this.#findAndRemoveRecursive([], node, prefix, filter)
  }

  #findAndRemoveRecursive(
    values: string[],
    node: PrefixLookupNode,
    prefix: string,
    filter: (nodeValue: string) => boolean,
  ): string[] {
    for (const char of Object.keys(node)) {
      if (!node[char]) continue
      this.#findAndRemoveRecursive(values, node[char], prefix + char, filter)
    }

    if (node[PrefixLookupTrieEndSymbol] && filter(prefix)) {
      node[PrefixLookupTrieEndSymbol] = false
      values.push(prefix)
    }

    return values
  }
}

export function flatRoutesImpl(appDirectory: string, prefix = 'routes', requireRoot = true) {
  const routesDir = path.join(appDirectory, prefix)

  const rootRoute = findFile(appDirectory, 'root', routeModuleExts)

  if (requireRoot && !rootRoute) {
    throw new Error(`Could not find a root route module in the app directory: ${appDirectory}`)
  }

  if (!fs.existsSync(routesDir)) {
    throw new Error(
      `Could not find the routes directory: ${routesDir}. Did you forget to create it?`,
    )
  }

  // Only read the routes directory
  const entries = fs.readdirSync(routesDir, {
    withFileTypes: true,
    encoding: 'utf-8',
  })

  const routes: string[] = []
  for (const entry of entries) {
    const filepath = normalizeSlashes(path.join(routesDir, entry.name))

    let route: string | null = null
    // If it's a directory, don't recurse into it, instead just look for a route module
    if (entry.isDirectory()) {
      route = findRouteModuleForFolder(appDirectory, filepath)
    } else if (entry.isFile()) {
      route = normalizeSlashes(filepath)
    }

    if (route) routes.push(route)
  }

  const routeManifest = flatRoutesUniversal(appDirectory, routes, prefix)
  return routeManifest
}

export function flatRoutesUniversal(
  appDirectory: string,
  routes: string[],
  prefix: string = 'routes',
): RouteManifest {
  const urlConflicts = new Map<string, RouteManifestEntry[]>()
  const routeManifest: RouteManifest = {}
  const prefixLookup = new PrefixLookupTrie()
  const uniqueRoutes = new Map<string, RouteManifestEntry>()
  const routeIdConflicts = new Map<string, string[]>()

  // id -> file
  const routeIds = new Map<string, string>()

  for (const file of routes) {
    const normalizedFile = normalizeSlashes(file)
    const routeExt = path.extname(normalizedFile)
    const routeDir = path.dirname(normalizedFile)
    const normalizedApp = normalizeSlashes(appDirectory)
    const routeId =
      routeDir === path.posix.join(normalizedApp, prefix)
        ? path.posix.relative(normalizedApp, normalizedFile).slice(0, -routeExt.length)
        : path.posix.relative(normalizedApp, routeDir)

    const conflictRouteId = routeIds.get(routeId)
    const conflict = conflictRouteId && !conflictRouteId.includes('.md')
    if (conflict) {
      let currentConflicts = routeIdConflicts.get(routeId)
      if (!currentConflicts) {
        currentConflicts = [path.posix.relative(normalizedApp, conflictRouteId)]
      }
      currentConflicts.push(path.posix.relative(normalizedApp, normalizedFile))
      routeIdConflicts.set(routeId, currentConflicts)
      continue
    }

    routeIds.set(routeId, normalizedFile)
  }

  const sortedRouteIds = Array.from(routeIds).sort(([a], [b]) => b.length - a.length)

  for (const [routeId, file] of sortedRouteIds) {
    const index = routeId.endsWith('_index')
    const [segments, raw] = getRouteSegments(routeId.slice(prefix.length + 1))
    const pathname = createRoutePath(segments, raw, index)

    routeManifest[routeId] = {
      file,
      id: routeId,
      path: pathname,
    }
    if (index) routeManifest[routeId].index = true
    const childRouteIds = prefixLookup.findAndRemove(routeId, (value) => {
      return ['.', '/'].includes(value.slice(routeId.length).charAt(0))
    })
    prefixLookup.add(routeId)

    if (childRouteIds.length > 0) {
      for (const childRouteId of childRouteIds) {
        if (!routeManifest[childRouteId]) continue
        routeManifest[childRouteId].parentId = routeId
      }
    }
  }

  // path creation
  const parentChildrenMap = new Map<string, RouteManifestEntry[]>()
  for (const [routeId] of sortedRouteIds) {
    const config = routeManifest[routeId]
    if (!config) continue
    if (!config.parentId) continue
    const existingChildren = parentChildrenMap.get(config.parentId) || []
    existingChildren.push(config)
    parentChildrenMap.set(config.parentId, existingChildren)
  }

  for (const [routeId] of sortedRouteIds) {
    const config = routeManifest[routeId]
    if (!config) continue
    const originalPathname = config.path || ''
    let pathname = config.path
    const parentConfig = config.parentId ? routeManifest[config.parentId] : null
    if (parentConfig?.path && pathname) {
      pathname = pathname.slice(parentConfig.path.length).replace(/^\//, '').replace(/\/$/, '')
    }

    if (!config.parentId) config.parentId = 'root'
    config.path = pathname || undefined

    /**
     * We do not try to detect path collisions for pathless layout route
     * files because, by definition, they create the potential for route
     * collisions _at that level in the tree_.
     *
     * Consider example where a user may want multiple pathless layout routes
     * for different subfolders
     *
     *   routes/
     *     account.tsx
     *     account._private.tsx
     *     account._private.orders.tsx
     *     account._private.profile.tsx
     *     account._public.tsx
     *     account._public.login.tsx
     *     account._public.perks.tsx
     *
     * In order to support both a public and private layout for `/account/*`
     * URLs, we are creating a mutually exclusive set of URLs beneath 2
     * separate pathless layout routes.  In this case, the route paths for
     * both account._public.tsx and account._private.tsx is the same
     * (/account), but we're again not expecting to match at that level.
     *
     * By only ignoring this check when the final portion of the filename is
     * pathless, we will still detect path collisions such as:
     *
     *   routes/parent._pathless.foo.tsx
     *   routes/parent._pathless2.foo.tsx
     *
     * and
     *
     *   routes/parent._pathless/index.tsx
     *   routes/parent._pathless2/index.tsx
     */
    const lastRouteSegment = config.id
      .replace(new RegExp(`^${prefix}/`), '')
      .split('.')
      .pop()
    const isPathlessLayoutRoute = lastRouteSegment?.startsWith('_') && lastRouteSegment !== '_index'
    if (isPathlessLayoutRoute) {
      continue
    }

    const conflictRouteId = originalPathname + (config.index ? '?index' : '')
    const conflict = uniqueRoutes.get(conflictRouteId)
    uniqueRoutes.set(conflictRouteId, config)

    if (conflict && (originalPathname || config.index)) {
      let currentConflicts = urlConflicts.get(originalPathname)
      if (!currentConflicts) currentConflicts = [conflict]
      currentConflicts.push(config)
      urlConflicts.set(originalPathname, currentConflicts)
    }
  }

  if (routeIdConflicts.size > 0) {
    for (const [routeId, files] of routeIdConflicts.entries()) {
      if (files.length === 2 && files.some((f) => f.includes('.md'))) continue
      console.error(getRouteIdConflictErrorMessage(routeId, files))
    }
  }

  // report conflicts
  if (urlConflicts.size > 0) {
    for (const [path, routes] of urlConflicts.entries()) {
      // delete all but the first route from the manifest
      for (let i = 1; i < routes.length; i++) {
        const route = routes[i]
        if (!route) continue
        delete routeManifest[route.id]
      }
      const files = routes.map((r) => r.file)
      console.error(getRoutePathConflictErrorMessage(path, files))
    }
  }

  return routeManifest
}

function findRouteModuleForFolder(appDirectory: string, filepath: string): string | null {
  const routeRouteModule = findFile(filepath, 'route', routeModuleExts)
  const routeIndexModule = findFile(filepath, 'index', routeModuleExts)

  // if both a route and index module exist, throw a conflict error
  // preferring the route module over the index module
  if (routeRouteModule && routeIndexModule) {
    const [segments, raw] = getRouteSegments(path.relative(appDirectory, filepath))
    const routePath = createRoutePath(segments, raw, false)
    console.error(
      getRoutePathConflictErrorMessage(routePath || '/', [routeRouteModule, routeIndexModule]),
    )
  }

  return routeRouteModule || routeIndexModule || null
}

type State =
  | // normal path segment normal character concatenation until we hit a special character or the end of the segment (i.e. `/`, `.`, '\')
  'NORMAL'
  // we hit a `[` and are now in an escape sequence until we hit a `]` - take characters literally and skip isSegmentSeparator checks
  | 'ESCAPE'
  // we hit a `(` and are now in an optional segment until we hit a `)` or an escape sequence
  | 'OPTIONAL'
  // we previously were in a opt fional segment and hit a `[` and are now in an escape sequence until we hit a `]` - take characters literally and skip isSegmentSeparator checks - afterwards go back to OPTIONAL state
  | 'OPTIONAL_ESCAPE'

export function getRouteSegments(routeId: string): [string[], string[]] {
  const routeSegments: string[] = []
  const rawRouteSegments: string[] = []
  let index = 0
  let routeSegment = ''
  let rawRouteSegment = ''
  let state: State = 'NORMAL'

  const pushRouteSegment = (segment: string, rawSegment: string) => {
    if (!segment) return

    const notSupportedInRR = (segment: string, char: string) => {
      throw new Error(
        `Route segment "${segment}" for "${routeId}" cannot contain "${char}".\n` +
          `If this is something you need, upvote this proposal for React Router https://github.com/remix-run/react-router/discussions/9822.`,
      )
    }

    if (rawSegment.includes('*')) {
      return notSupportedInRR(rawSegment, '*')
    }

    if (rawSegment.includes(':')) {
      return notSupportedInRR(rawSegment, ':')
    }

    if (rawSegment.includes('/')) {
      return notSupportedInRR(segment, '/')
    }

    routeSegments.push(segment)
    rawRouteSegments.push(rawSegment)
  }

  while (index < routeId.length) {
    const char = routeId[index]
    index++ //advance to next char

    switch (state) {
      case 'NORMAL': {
        if (isSegmentSeparator(char)) {
          pushRouteSegment(routeSegment, rawRouteSegment)
          routeSegment = ''
          rawRouteSegment = ''
          state = 'NORMAL'
          break
        }
        if (char === escapeChar) {
          // ! escapes the next character (e.g., !. becomes literal .)
          const nextChar = routeId[index]
          if (nextChar) {
            index++
            routeSegment += nextChar
            rawRouteSegment += char + nextChar
          }
          break
        }
        if (char === escapeStart) {
          state = 'ESCAPE'
          rawRouteSegment += char
          break
        }
        if (char === optionalStart) {
          state = 'OPTIONAL'
          rawRouteSegment += char
          break
        }
        if (!routeSegment && char === paramPrefixChar) {
          if (index === routeId.length) {
            routeSegment += '*'
            rawRouteSegment += char
          } else {
            routeSegment += ':'
            rawRouteSegment += char
          }
          break
        }

        routeSegment += char
        rawRouteSegment += char
        break
      }
      case 'ESCAPE': {
        if (char === escapeEnd) {
          state = 'NORMAL'
          rawRouteSegment += char
          break
        }

        routeSegment += char
        rawRouteSegment += char
        break
      }
      case 'OPTIONAL': {
        if (char === optionalEnd) {
          routeSegment += '?'
          rawRouteSegment += char
          state = 'NORMAL'
          break
        }

        if (char === escapeChar) {
          const nextChar = routeId[index]
          if (nextChar) {
            index++
            routeSegment += nextChar
            rawRouteSegment += char + nextChar
          }
          break
        }

        if (char === escapeStart) {
          state = 'OPTIONAL_ESCAPE'
          rawRouteSegment += char
          break
        }

        if (!routeSegment && char === paramPrefixChar) {
          if (index === routeId.length) {
            routeSegment += '*'
            rawRouteSegment += char
          } else {
            routeSegment += ':'
            rawRouteSegment += char
          }
          break
        }

        routeSegment += char
        rawRouteSegment += char
        break
      }
      case 'OPTIONAL_ESCAPE': {
        if (char === escapeEnd) {
          state = 'OPTIONAL'
          rawRouteSegment += char
          break
        }

        routeSegment += char
        rawRouteSegment += char
        break
      }
    }
  }

  // process remaining segment
  pushRouteSegment(routeSegment, rawRouteSegment)
  return [routeSegments, rawRouteSegments]
}

export function createRoutePath(
  routeSegments: string[],
  rawRouteSegments: string[],
  isIndex?: boolean | undefined,
) {
  const result: string[] = []

  if (isIndex) {
    routeSegments = routeSegments.slice(0, -1)
  }

  for (let index = 0; index < routeSegments.length; index++) {
    let segment = routeSegments[index]
    const rawSegment = rawRouteSegments[index]

    if (!segment) continue
    if (!rawSegment) continue

    // skip pathless layout segments
    if (segment.startsWith('_') && rawSegment.startsWith('_')) {
      continue
    }

    // remove trailing slash
    if (segment.endsWith('_') && rawSegment.endsWith('_')) {
      segment = segment.slice(0, -1)
    }

    result.push(segment)
  }

  return result.length ? result.join('/') : undefined
}

export function getRoutePathConflictErrorMessage(pathname: string, routes: string[]) {
  const [taken, ...others] = routes

  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`
  }

  return (
    `⚠️ Route Path Collision: "${pathname}"\n\n` +
    `The following routes all define the same URL, only the first one will be used\n\n` +
    `🟢 ${taken}\n` +
    others.map((route) => `⭕️️ ${route}`).join('\n') +
    '\n'
  )
}

export function getRouteIdConflictErrorMessage(routeId: string, files: string[]) {
  const [taken, ...others] = files

  return (
    `⚠️ Route ID Collision: "${routeId}"\n\n` +
    `The following routes all define the same Route ID, only the first one will be used\n\n` +
    `🟢 ${taken}\n` +
    others.map((route) => `⭕️️ ${route}`).join('\n') +
    '\n'
  )
}

export function isSegmentSeparator(checkChar: string | undefined) {
  if (!checkChar) return false
  return ['/', '.', path.win32.sep].includes(checkChar)
}

function findFile(dir: string, basename: string, extensions: string[]): string | undefined {
  for (const ext of extensions) {
    const name = basename + ext
    const file = path.join(dir, name)
    if (fs.existsSync(file)) return file
  }

  return undefined
}

export function normalizeSlashes(file: string) {
  return file.replaceAll(path.win32.sep, '/')
}

// biome-ignore lint/suspicious/noExplicitAny: _
type Exact<type> = type extends (...args: any[]) => any
  ? type
  : type extends readonly [infer head, ...infer tail]
    ? [Exact<head>, ...Exact<tail>]
    : type extends (infer type)[]
      ? Exact<type>[]
      : type extends object
        ? {
            // biome-ignore lint/complexity/noBannedTypes: _
            [key in keyof type as {} extends Pick<type, key> ? key : never]?:
              | Exact<type[key]>
              | undefined
          } & {
            // biome-ignore lint/complexity/noBannedTypes: _
            [key in keyof type as {} extends Pick<type, key> ? never : key]: Exact<type[key]>
          }
        : type
