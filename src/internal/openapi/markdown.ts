import type { Config } from '../config.js'
import type { Ir, IrGroup, IrOperation, IrParameter, IrResponse } from './parser.js'
import * as Registry from './registry.js'
import { codeSamples } from './sample.js'

/**
 * A generated Markdown page for an OpenAPI route, ready to be served verbatim by
 * the `.md` router / written as an `/assets/md` asset.
 */
export type Page = {
  path: string
  title: string
  description?: string | undefined
  /** Final Markdown, used verbatim (no MDX reprocessing). */
  content: string
}

/**
 * Builds Markdown pages for every configured OpenAPI section.
 *
 * Produces one page per mount (the section overview, listing every category and
 * its endpoints) plus one page per category (`${mount}/${group.id}`), rendering
 * each operation's parameters, request body, responses, and an example request.
 *
 * These mirror the routes created in the Waku router so `/<mount>.md` and
 * `/<mount>/<group>.md` resolve to a readable, agent-friendly version of the
 * same reference shown in the browser.
 */
export async function toPages(config: Config): Promise<Page[]> {
  if (!config.openapi?.length) return []

  const specs = await Registry.build(config)
  return Object.values(specs).flatMap(fromIr)
}

/**
 * Builds the Markdown pages for a single parsed spec: the section overview plus
 * one page per category. Pure (no registry/network), so it's the unit-testable
 * seam under {@link toPages}.
 */
export function fromIr(ir: Ir): Page[] {
  return [overviewPage(ir), ...ir.groups.map((group) => groupPage(ir, group))]
}

/** Section overview page: API metadata + every category's endpoints. */
function overviewPage(ir: Ir): Page {
  return {
    path: ir.path,
    title: ir.info.title,
    description: ir.info.description ? oneLine(ir.info.description) : undefined,
    content: renderOverview(ir, normalizeMount(ir.path)),
  }
}

/**
 * Markdown for the section overview: API metadata + every category's endpoints.
 *
 * `linkBase` is prepended to operation anchors so the endpoint links resolve to
 * wherever the section is mounted (the site uses the configured spec path; the
 * standalone handler passes the live host mount).
 */
export function renderOverview(ir: Ir, linkBase: string): string {
  const base = normalizeMount(linkBase)
  const lines: string[] = [`# ${ir.info.title}`, '']
  if (ir.info.version) lines.push(`Version: \`${ir.info.version}\``, '')
  if (ir.info.description) lines.push(ir.info.description.trim(), '')

  if (ir.servers.length > 0) {
    lines.push('## Servers', '')
    for (const server of ir.servers)
      lines.push(
        `- \`${server.url}\`${server.description ? `: ${oneLine(server.description)}` : ''}`,
      )
    lines.push('')
  }

  lines.push('## Endpoints', '')
  for (const group of ir.groups) {
    lines.push(`### ${group.name}`, '')
    if (group.description) lines.push(oneLine(group.description), '')
    for (const operation of group.operations) {
      const href = `${base}/${group.id}#${operation.id}`
      const label = operation.summary ? `: ${oneLine(operation.summary)}` : ''
      lines.push(`- [\`${operation.method} ${operation.path}\`](${href})${label}`)
    }
    lines.push('')
  }

  return `${lines.join('\n').trimEnd()}\n`
}

/** Category page: full detail for each operation in the group. */
function groupPage(ir: Ir, group: IrGroup): Page {
  return {
    path: `${normalizeMount(ir.path)}/${group.id}`,
    title: group.name,
    description: group.description ? oneLine(group.description) : undefined,
    content: renderGroup(ir, group),
  }
}

/** Markdown for a single category: full detail for each of its operations. */
export function renderGroup(ir: Ir, group: IrGroup): string {
  const lines: string[] = [`# ${group.name}`, '']
  if (group.description) lines.push(group.description.trim(), '')

  const server = ir.servers[0]?.url
  for (const operation of group.operations) lines.push(...operationLines(operation, server))

  return `${lines.join('\n').trimEnd()}\n`
}

function operationLines(operation: IrOperation, server?: string): string[] {
  const lines: string[] = []
  const title = operation.summary ?? `${operation.method} ${operation.path}`
  lines.push(`## ${title}`, '')
  lines.push(`\`${operation.method} ${operation.path}\``, '')
  if (operation.deprecated) lines.push('> **Deprecated**', '')
  if (operation.description) lines.push(operation.description.trim(), '')

  const byLocation = (location: IrParameter['in']) =>
    operation.parameters.filter((parameter) => parameter.in === location && !parameter.deprecated)

  for (const [location, heading] of [
    ['path', 'Path parameters'],
    ['query', 'Query parameters'],
    ['header', 'Header parameters'],
  ] as const) {
    const params = byLocation(location)
    if (params.length === 0) continue
    lines.push(`### ${heading}`, '')
    for (const parameter of params) lines.push(parameterLine(parameter))
    lines.push('')
  }

  if (operation.requestBody) {
    const body = operation.requestBody
    const media = body.content[0]
    const mediaType = media ? ` (\`${media.mediaType}\`)` : ''
    lines.push(`### Request body${body.required ? ' (required)' : ''}${mediaType}`, '')
    if (body.description) lines.push(oneLine(body.description), '')
    if (media?.schema) {
      const props = schemaLines(media.schema, 0)
      if (props.length > 0) lines.push(...props, '')
    }
  }

  if (operation.responses.length > 0) {
    lines.push('### Responses', '')
    for (const response of operation.responses) lines.push(...responseLines(response))
  }

  const samples = codeSamples(operation, server)
  if (samples.length > 0) {
    lines.push('### Example request', '')
    for (const sample of samples) {
      lines.push(`\`\`\`${sample.lang}`, sample.code.trim(), '```', '')
    }
  }

  return lines
}

function parameterLine(parameter: IrParameter): string {
  const required = parameter.required ? ' _(required)_' : ''
  const type = `\`${typeLabel(parameter.schema)}\``
  const description = parameter.description ? `: ${oneLine(parameter.description)}` : ''
  return `- \`${parameter.name}\` ${type}${required}${description}`
}

function responseLines(response: IrResponse): string[] {
  const lines: string[] = []
  const description = response.description ? `: ${oneLine(response.description)}` : ''
  lines.push(`#### \`${response.status}\`${description}`, '')

  if (response.headers.length > 0) {
    lines.push('Headers:', '')
    for (const header of response.headers)
      lines.push(
        `- \`${header.name}\` \`${typeLabel(header.schema)}\`${
          header.description ? `: ${oneLine(header.description)}` : ''
        }`,
      )
    lines.push('')
  }

  const media = response.content[0]
  if (media?.schema) {
    const props = schemaLines(media.schema, 0)
    if (props.length > 0) {
      if (media.mediaType) lines.push(`Body (\`${media.mediaType}\`):`, '')
      lines.push(...props, '')
    }
  }

  return lines
}

const maxDepth = 4

/**
 * Renders an object schema's properties as an indented Markdown bullet list,
 * recursing into nested objects (and array-of-object items) up to {@link
 * maxDepth}. Returns an empty array for non-object schemas.
 */
function schemaLines(schema: SchemaObject | undefined, depth: number): string[] {
  if (!schema || depth > maxDepth) return []

  const target = schema['type'] === 'array' ? (schema['items'] as SchemaObject) : schema
  const properties = target?.['properties'] as Record<string, SchemaObject> | undefined
  if (!properties) return []

  const required = new Set((target?.['required'] as string[] | undefined) ?? [])
  const indent = '  '.repeat(depth)
  const lines: string[] = []

  for (const [name, property] of Object.entries(properties)) {
    const requiredFlag = required.has(name) ? ' _(required)_' : ''
    const description = property['description']
      ? `: ${oneLine(String(property['description']))}`
      : ''
    lines.push(`${indent}- \`${name}\` \`${typeLabel(property)}\`${requiredFlag}${description}`)
    lines.push(...schemaLines(property, depth + 1))
  }

  return lines
}

type SchemaObject = Record<string, unknown>

/** Compact, human-readable type label for a JSON Schema (post-dereference). */
function typeLabel(schema: SchemaObject | undefined): string {
  if (!schema) return 'unknown'

  if (Array.isArray(schema['type'])) return (schema['type'] as string[]).join(' | ')

  const composite = (schema['oneOf'] ?? schema['anyOf']) as SchemaObject[] | undefined
  if (composite) return [...new Set(composite.map(typeLabel))].join(' | ')

  if (Array.isArray(schema['allOf']))
    return (schema['allOf'] as SchemaObject[]).map(typeLabel).join(' & ')

  if (schema['type'] === 'array') return `${typeLabel(schema['items'] as SchemaObject)}[]`

  if (typeof schema['type'] === 'string') {
    const format = schema['format'] ? ` <${schema['format']}>` : ''
    return `${schema['type']}${format}`
  }

  if (Array.isArray(schema['enum'])) return 'enum'
  if (schema['properties']) return 'object'

  return 'unknown'
}

/** Collapse Markdown/whitespace to a single readable line (for summaries). */
function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/** Mount path without a trailing slash (e.g. `/` -> ``, `/api/` -> `/api`). */
function normalizeMount(path: string): string {
  return path === '/' ? '' : path.replace(/\/$/, '')
}
