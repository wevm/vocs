import { resolveIconSync } from '../icons.js'
import type { SidebarItem } from '../sidebar.js'
import type { Ir, IrGroup, IrOperation } from './parser.js'
import { groupPath } from './route.js'

/** Inline SVG for the webhook badge, resolved once at module load (server-side). */
const webhookIcon = resolveIconSync('lucide:webhook')

export type Badge = NonNullable<SidebarItem['badge']>
export type BadgeVariant = NonNullable<Exclude<Badge, string>['variant']>

/**
 * Maps an HTTP method to a sidebar badge variant.
 */
export function methodVariant(method: string): BadgeVariant {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'info'
    case 'POST':
      return 'success'
    case 'PUT':
    case 'PATCH':
      return 'warning'
    case 'DELETE':
      return 'danger'
    default:
      return 'note'
  }
}

/**
 * Builds an isolated sidebar (categories → operation anchors) from a parsed
 * OpenAPI IR.
 *
 * Each category is its own page; operation links are in-page anchors on that
 * page (`/api/{group}#{operation}`). When the IR carries `tagGroups`, claimed
 * categories nest under static section headers; unclaimed ones follow at the
 * top level so no category silently disappears.
 */
export function toSidebar(ir: Ir, options: toSidebar.Options = {}): SidebarItem<true>[] {
  // Strip a trailing slash so a root mount (`/`) doesn't yield `//group`.
  const base = ir.path === '/' ? '' : ir.path.replace(/\/$/, '')
  const operationLink = (operation: IrOperation, group: IrGroup) =>
    `${base}/${groupPath(group)}#${operation.id}`

  const groupLink = (group: IrGroup) => `${base}/${groupPath(group)}`

  // When `intro` items are supplied, the "Introduction" leaf becomes a
  // collapsible group: an "Overview" link to the landing page followed by the
  // extra items (e.g. authentication/versioning guide pages).
  const intro = options.intro ?? []
  // With `introduction: false`, `intro` items render at the top level in
  // place of the generated entry.
  const introduction: SidebarItem<true>[] =
    options.introduction === false
      ? (intro as SidebarItem<true>[])
      : [
          intro.length > 0
            ? {
                text: 'Introduction',
                collapsed: false,
                items: [{ text: 'Overview', link: ir.path }, ...intro] as SidebarItem<true>[],
              }
            : { text: 'Introduction', link: ir.path },
        ]

  // Extra items (e.g. `x-parent` guide pages) injected into a group, keyed by
  // group id, rendered after the group's "Overview" link.
  const groupExtras = options.groupExtras ?? new Map<string, SidebarItem[]>()
  // Configured items and hidden names match a group's tag or display name.
  const groupItems = options.groupItems ?? {}
  const tagGroupItems = options.tagGroupItems ?? {}
  const hide = new Set(options.hide ?? [])
  const names = (group: IrGroup) => [...new Set([group.tag ?? group.name, group.name])]
  const itemsFor = (group: IrGroup) =>
    names(group).flatMap((name) => groupItems[name] ?? []) as SidebarItem<true>[]
  // Hidden groups keep their pages; only their sidebar items are dropped.
  const visible = (group: IrGroup) => !names(group).some((name) => hide.has(name))

  // Generated categories inherit `collapsed`. Tag-group sections can override
  // that default independently. Active groups still auto-expand at render.
  const groupCollapsed = options.collapsed ?? false
  const tagGroupsCollapsed = options.tagGroupsCollapsed ?? options.collapsed

  const groupItem = (group: Ir['groups'][number]): SidebarItem<true> => ({
    text: group.name,
    collapsed: groupCollapsed,
    items: [
      // An "Overview" entry links to the category itself; the top-level item
      // is a non-link header so its label doesn't compete with the operations.
      { text: 'Overview', link: groupLink(group) },
      ...((groupExtras.get(group.id) ?? []) as SidebarItem<true>[]),
      ...itemsFor(group),
      ...group.operations.map((operation) => ({
        text: operation.summary || `${operation.method} ${operation.path}`,
        link: operationLink(operation, group),
        // Webhooks are inbound deliveries, not callable endpoints — show a
        // webhook glyph instead of the HTTP method (which is always POST).
        badge:
          operation.isWebhook && webhookIcon
            ? { icon: webhookIcon, variant: methodVariant(operation.method) }
            : { text: operation.method, variant: methodVariant(operation.method) },
      })),
    ],
  })

  const tagGroups = ir.tagGroups ?? []
  if (tagGroups.length === 0) return [...introduction, ...ir.groups.filter(visible).map(groupItem)]

  // `x-tagGroups` sections render as collapsible headers. Sections named in
  // `flatten` spread their categories in place instead.
  const flatten = new Set(options.flatten ?? [])
  const groupById = new Map(ir.groups.map((group) => [group.id, group]))
  const claimed = new Set(tagGroups.flatMap((tagGroup) => tagGroup.groupIds))
  const sections = tagGroups.flatMap((tagGroup) => {
    if (hide.has(tagGroup.name)) return []
    const items = [
      ...((tagGroupItems[tagGroup.name] ?? []) as SidebarItem<true>[]),
      ...tagGroup.groupIds.flatMap((id) => {
        const group = groupById.get(id)
        return group && visible(group) ? [groupItem(group)] : []
      }),
    ]
    if (flatten.has(tagGroup.name)) return items
    return [{ text: tagGroup.name, collapsed: tagGroupsCollapsed, items }]
  })
  return [
    ...introduction,
    ...sections,
    ...ir.groups.filter((group) => !claimed.has(group.id) && visible(group)).map(groupItem),
  ]
}

export declare namespace toSidebar {
  type Options = {
    /** Items nested under the generated `Introduction` entry. */
    intro?: SidebarItem[] | undefined
    /**
     * Render the generated `Introduction` entry. When `false`, `intro` items
     * render at the top level in its place. @default true
     */
    introduction?: boolean | undefined
    /** Extra items injected into a generated group, keyed by tag name or display name. */
    groupItems?: Record<string, SidebarItem[]> | undefined
    /** Extra items prepended to an `x-tagGroups` section, keyed by section name. */
    tagGroupItems?: Record<string, SidebarItem[]> | undefined
    /** Tags or `x-tagGroups` sections to leave out of the sidebar (pages stay routable). */
    hide?: readonly string[] | undefined
    /** Extra items injected into a generated group, keyed by group id. */
    groupExtras?: Map<string, SidebarItem[]> | undefined
    /**
     * Collapse generated category groups by default. Also controls `x-tagGroups`
     * sections unless `tagGroupsCollapsed` overrides it. @default false
     */
    collapsed?: boolean | undefined
    /**
     * Names of `x-tagGroups` sections whose categories render as top-level
     * items (in place) instead of nesting under the section header.
     */
    flatten?: readonly string[] | undefined
    /** Collapse `x-tagGroups` sections independently. @default collapsed */
    tagGroupsCollapsed?: boolean | undefined
  }
}
