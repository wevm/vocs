import type { Config } from './config.js'
import type { OneOf } from './types.js'

export type SidebarItem<strict extends boolean = false> = {
  /** Whether or not to disable the sidebar item. */
  disabled?: boolean | undefined
  /** Optional children to nest under this item. */
  items?: SidebarItem<true>[] | undefined
  /** Text to display on the sidebar. */
  text?: string | undefined
} & (strict extends true
  ? OneOf<
      | {
          /** Whether or not to collapse the sidebar item by default. */
          collapsed: boolean
        }
      | {
          /** Optional pathname to the target documentation page. */
          link: string
        }
      // biome-ignore lint/complexity/noBannedTypes: _
      | {}
    >
  : {
      /** Whether or not to collapse the sidebar item by default. */
      collapsed?: boolean | undefined
      /** Optional pathname to the target documentation page. */
      link?: string | undefined
    })

export type Sidebar = {
  backLink?: boolean | undefined
  items: SidebarItem[]
  key?: string | undefined
}

export function flatten(items: SidebarItem[]): Omit<SidebarItem, 'items'>[] {
  const result: Omit<SidebarItem, 'items'>[] = []
  for (const item of items) {
    if (item.link) {
      const { items: _, ...rest } = item
      result.push(rest)
    }
    if (item.items) result.push(...flatten(item.items))
  }
  return result
}

export function fromConfig(config: Config['sidebar'], path: string) {
  if (!config) return { items: [] }

  function group(items: SidebarItem[]): SidebarItem[] {
    const groups: SidebarItem[] = []

    let group: SidebarItem | null = null
    for (const item of items) {
      if (item.items) {
        group = null
        groups.push(item)
        continue
      }

      if (!group) {
        group = { items: [item as SidebarItem<true>] }
        groups.push(group)
      } else group.items?.push(item as SidebarItem<true>)
    }

    return groups
  }

  // Handle array sidebar (no path-based matching)
  if (Array.isArray(config)) return { items: group(config) }

  // Find matching key - deepest path takes precedence
  const keys = Object.keys(config)
    .filter((key) => path.startsWith(key))
    .sort((a, b) => b.length - a.length)
  const sidebarKey = keys[0]
  if (!sidebarKey) return { items: [] }

  const value = config[sidebarKey]
  if (Array.isArray(value)) return { key: sidebarKey, items: group(value) }
  if (value && typeof value === 'object' && 'items' in value) {
    return {
      key: sidebarKey,
      backLink: value.backLink,
      items: group(value.items),
    }
  }

  return { items: [] }
}

export function length(items: SidebarItem[], options: length.Options = {}): number {
  const { startDepth = 0 } = options
  let count = 0

  function traverse(items: SidebarItem[], depth: number): void {
    for (const item of items) {
      if (depth >= startDepth) count++
      if (item.items) traverse(item.items, depth + 1)
    }
  }

  traverse(items, 0)
  return count
}

export namespace length {
  export type Options = {
    startDepth?: number
  }
}
