import * as Markdown from '../markdown.js'
import type { SearchDocuments } from '../search.js'
import type { Ir, IrOperation } from './parser.js'

/**
 * Builds search index documents for an OpenAPI section so the auto-generated
 * reference is discoverable by Vocs's search (which otherwise only crawls
 * `.md`/`.mdx` files).
 *
 * Mirrors the page/anchor structure of the rendered reference:
 * - the `/api` landing page (one `page` document),
 * - each category page `/api/<group>` (one `page` document), and
 * - each operation as a `section` document anchored on its category page
 *   (`/api/<group>#<operation>`).
 *
 * Operation documents fold the method, path, parameter names/descriptions and
 * response descriptions into their searchable `text` so endpoints surface for a
 * wide range of queries (summary, path, parameter, status code, …).
 */
export function toSearchDocuments(ir: Ir): SearchDocuments.Document[] {
  const category = ir.info.title
  const documents: SearchDocuments.Document[] = []
  // Strip a trailing slash so a root mount (`/`) doesn't yield `//group` hrefs.
  const base = ir.path === '/' ? '' : ir.path.replace(/\/$/, '')

  // Section landing page (`/api`).
  documents.push({
    category,
    href: ir.path,
    id: `openapi:${ir.path}`,
    searchPriority: undefined,
    subtitle: '',
    text: Markdown.toText(ir.info.description),
    title: ir.info.title,
    titles: [],
    type: 'page',
  })

  for (const group of ir.groups) {
    const groupHref = `${base}/${group.id}`

    // Category page (`/api/<group>`).
    documents.push({
      category,
      href: groupHref,
      id: `openapi:${groupHref}`,
      searchPriority: undefined,
      subtitle: '',
      text: Markdown.toText(group.description),
      title: group.name,
      titles: [ir.info.title],
      type: 'page',
    })

    // Each operation, anchored on its category page.
    for (const operation of group.operations) {
      const methodPath = `${operation.method} ${operation.path}`
      documents.push({
        category,
        href: `${groupHref}#${operation.id}`,
        id: `openapi:${groupHref}#${operation.id}`,
        searchPriority: undefined,
        subtitle: methodPath,
        text: operationText(operation),
        title: operation.summary || methodPath,
        titles: [ir.info.title, group.name],
        type: 'section',
      })
    }
  }

  return documents
}

/** Folds an operation's searchable content into a single plain-text string. */
function operationText(operation: IrOperation): string {
  const parts = [
    `${operation.method} ${operation.path}`,
    Markdown.toText(operation.description),
    Markdown.toText(operation.summary),
    ...operation.parameters
      .filter((parameter) => !parameter.deprecated)
      .map((parameter) => `${parameter.name} ${Markdown.toText(parameter.description)}`.trim()),
    ...operation.responses.map((response) =>
      `${response.status} ${Markdown.toText(response.description)}`.trim(),
    ),
  ]
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}
