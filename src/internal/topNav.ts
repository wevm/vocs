import type { OneOf, UnionOmit } from './types.js'

export type Item = {
  /**
   * The path to match against the current path.
   *
   * @example "/docs"
   * @example (path) => path?.startsWith("/docs")
   */
  match?: string | ((path: string | undefined) => boolean) | undefined
  /**
   * Text to display.
   */
  text: string
} & OneOf<
  | {
      /**
       * The link to navigate to when the item is clicked.
       */
      link: string
    }
  | {
      /**
       * Nested items.
       */
      items: readonly UnionOmit<Item, 'items'>[]
    }
>

export type ParsedItem = Omit<Item, 'items'> & {
  active: boolean
  items?: readonly Omit<ParsedItem, 'items'>[] | undefined
}

export type FlatItem = {
  link: string
  text: string
  /** Parent text for items inside a dropdown */
  parent?: string | undefined
}

export function flatten(topNav: readonly Item[] | undefined): FlatItem[] {
  if (!topNav) return []
  const result: FlatItem[] = []
  for (const item of topNav) {
    if ('items' in item && item.items) {
      for (const child of item.items)
        if (child.link) result.push({ link: child.link, text: child.text, parent: item.text })
    } else if ('link' in item && item.link) result.push({ link: item.link, text: item.text })
  }
  return result
}

export function parse(topNav: readonly Item[] | undefined, path: string | undefined): ParsedItem[] {
  if (!topNav) return []

  type Match = { item: number; child?: number; depth: number }
  let match: Match | undefined

  function getDepth(
    match: string | ((path: string | undefined) => boolean) | undefined,
    path: string | undefined,
  ): number | undefined {
    if (!match || !path) return undefined
    if (typeof match === 'function') return match(path) ? 0 : undefined
    const match_ = match.endsWith('/') ? match : `${match}/`
    const path_ = path.endsWith('/') ? path : `${path}/`
    if (!path_.startsWith(match_)) return undefined
    return match.split('/').filter(Boolean).length
  }

  for (let i = 0; i < topNav.length; i++) {
    const item = topNav[i]
    if (!item) continue

    if ('items' in item && item.items) {
      for (let j = 0; j < item.items.length; j++) {
        const child = item.items[j]
        if (!child) continue

        const depth = getDepth(child.match ?? child.link, path)
        if (depth !== undefined && (!match || depth > match.depth))
          match = { item: i, child: j, depth }
      }
    } else if ('link' in item) {
      const depth = getDepth(item.match ?? item.link, path)
      if (depth !== undefined && (!match || depth > match.depth)) match = { item: i, depth }
    }
  }

  return topNav.map((item, i) => {
    if ('items' in item && item.items) {
      const items = item.items.map((child, j) => ({
        ...child,
        active: match?.item === i && match?.child === j,
      }))
      return {
        ...item,
        items,
        active: items.some((c) => c.active) || (match?.item === i && match?.child === undefined),
      }
    }
    return { ...item, active: match?.item === i }
  }) as ParsedItem[]
}
