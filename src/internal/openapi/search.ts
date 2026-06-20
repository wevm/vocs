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

  // Section landing page (`/api`).
  documents.push({
    category,
    href: ir.path,
    id: `openapi:${ir.path}`,
    searchPriority: undefined,
    subtitle: '',
    text: plainText(ir.info.description),
    title: ir.info.title,
    titles: [],
    type: 'page',
  })

  for (const group of ir.groups) {
    const groupHref = `${ir.path}/${group.id}`

    // Category page (`/api/<group>`).
    documents.push({
      category,
      href: groupHref,
      id: `openapi:${groupHref}`,
      searchPriority: undefined,
      subtitle: '',
      text: plainText(group.description),
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
    plainText(operation.description),
    plainText(operation.summary),
    ...operation.parameters
      .filter((parameter) => !parameter.deprecated)
      .map((parameter) => `${parameter.name} ${plainText(parameter.description)}`.trim()),
    ...operation.responses.map((response) =>
      `${response.status} ${plainText(response.description)}`.trim(),
    ),
  ]
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Reduces a Markdown string to plain text suitable for the search index. Strips
 * the common inline/block syntax (links, emphasis, code, headings, lists,
 * blockquotes, images) so only human-readable words remain for tokenization.
 */
function plainText(markdown: string | undefined): string {
  if (!markdown) return ''
  return markdown
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images → alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → label
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}>\s?/gm, '') // blockquotes
    .replace(/^\s*[-*+]\s+/gm, '') // unordered list markers
    .replace(/[*_~]/g, '') // emphasis / strikethrough
    .replace(/\s+/g, ' ')
    .trim()
}
