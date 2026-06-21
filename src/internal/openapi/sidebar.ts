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
export function toSidebar(ir: Ir): SidebarItem<true>[] {
  // Strip a trailing slash so a root mount (`/`) doesn't yield `//group`.
  const base = ir.path === '/' ? '' : ir.path.replace(/\/$/, '')
  const operationLink = (operation: IrOperation, groupId: string) =>
    `${base}/${groupId}#${operation.id}`

  const groupLink = (groupId: string) => `${base}/${groupId}`

  return [
    // A root "Introduction" item links to the section landing page (`/api`).
    { text: 'Introduction', link: ir.path },
    ...ir.groups.map((group) => ({
      text: group.name,
      collapsed: false,
      items: [
        // An "Overview" entry links to the category itself; the top-level item
        // is a non-link header so its label doesn't compete with the operations.
        { text: 'Overview', link: groupLink(group.id) },
        ...group.operations.map((operation) => ({
          text: operation.summary || `${operation.method} ${operation.path}`,
          link: operationLink(operation, group.id),
          badge: { text: operation.method, variant: methodVariant(operation.method) },
        })),
      ],
    })),
  ]
}
