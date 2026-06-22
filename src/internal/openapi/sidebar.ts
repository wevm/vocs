import type { SidebarItem } from '../sidebar.js'
import type { Ir, IrOperation } from './parser.js'

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
 * page (`/api/{group}#{operation}`).
 */
export function toSidebar(ir: Ir, options: toSidebar.Options = {}): SidebarItem<true>[] {
  // Strip a trailing slash so a root mount (`/`) doesn't yield `//group`.
  const base = ir.path === '/' ? '' : ir.path.replace(/\/$/, '')
  const operationLink = (operation: IrOperation, groupId: string) =>
    `${base}/${groupId}#${operation.id}`

  const groupLink = (groupId: string) => `${base}/${groupId}`

  // When `intro` items are supplied, the "Introduction" leaf becomes a
  // collapsible group: an "Overview" link to the landing page followed by the
  // extra items (e.g. authentication/versioning guide pages).
  const intro = options.intro ?? []
  const introduction: SidebarItem<true> =
    intro.length > 0
      ? {
          text: 'Introduction',
          collapsed: false,
          items: [{ text: 'Overview', link: ir.path }, ...intro] as SidebarItem<true>[],
        }
      : { text: 'Introduction', link: ir.path }

  // Extra items (e.g. `x-parent` guide pages) injected into a group, keyed by
  // group id, rendered after the group's "Overview" link.
  const groupExtras = options.groupExtras ?? new Map<string, SidebarItem[]>()

  // Generated category groups start collapsed when `collapsed` is set (the
  // active group still auto-expands at render). `Introduction` is unaffected.
  const groupCollapsed = options.collapsed ?? false

  return [
    introduction,
    ...ir.groups.map((group) => ({
      text: group.name,
      collapsed: groupCollapsed,
      items: [
        // An "Overview" entry links to the category itself; the top-level item
        // is a non-link header so its label doesn't compete with the operations.
        { text: 'Overview', link: groupLink(group.id) },
        ...((groupExtras.get(group.id) ?? []) as SidebarItem<true>[]),
        ...group.operations.map((operation) => ({
          text: operation.summary || `${operation.method} ${operation.path}`,
          link: operationLink(operation, group.id),
          badge: { text: operation.method, variant: methodVariant(operation.method) },
        })),
      ],
    })),
  ]
}

export declare namespace toSidebar {
  type Options = {
    /** Items nested under the generated `Introduction` entry. */
    intro?: SidebarItem[] | undefined
    /** Extra items injected into a generated group, keyed by group id. */
    groupExtras?: Map<string, SidebarItem[]> | undefined
    /**
     * Collapse the generated category groups by default (the active group still
     * auto-expands). `Introduction` is unaffected. @default false
     */
    collapsed?: boolean | undefined
  }
}
