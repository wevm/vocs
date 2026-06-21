import { dereference, upgrade } from '@scalar/openapi-parser'
import GithubSlugger from 'github-slugger'
import type * as OpenApi from './openapi.js'

/**
 * HTTP methods recognized on an OpenAPI path item, in canonical display order.
 */
export const methods = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
] as const

export type Method = (typeof methods)[number]

/**
 * Intermediate representation of a parsed OpenAPI document.
 *
 * This is the serializable shape consumed by the React rendering layer (via the
 * `virtual:vocs/openapi` module) and the sidebar generator. It intentionally
 * keeps raw JSON Schema objects (`parameters`, `requestBody`, `responses`) so
 * the renderer can display them without a lossy transform.
 */
export type Ir = {
  /** Mount path the section is served at (e.g. `/api`). */
  path: string
  /**
   * Spec source handed to the interactive client (Scalar API client). A `url`
   * when the configured spec is a URL (the client fetches it directly), else
   * the upgraded document `content` so the client works for file/inline specs.
   */
  client: { url: string } | { content: Record<string, unknown> }
  /** Document metadata. */
  info: {
    title: string
    version?: string | undefined
    description?: string | undefined
  }
  /** Servers the API is hosted at. */
  servers: IrServer[]
  /** Operations grouped by category (tag or path segment). */
  groups: IrGroup[]
  /** Named security schemes from `components.securitySchemes`. */
  securitySchemes: Record<string, IrSecurityScheme>
}

export type IrServer = {
  url: string
  description?: string | undefined
}

export type IrGroup = {
  /** Stable slug used as the section anchor on the page. */
  id: string
  /** Display name of the category. */
  name: string
  /** Optional category description (Markdown). */
  description?: string | undefined
  /** Operations belonging to this category. */
  operations: IrOperation[]
}

export type IrOperation = {
  /** Stable slug used as the operation's anchor on the page. */
  id: string
  /** HTTP method (uppercased for display, e.g. `GET`). */
  method: string
  /** Templated path (e.g. `/pets/{petId}`). */
  path: string
  summary?: string | undefined
  description?: string | undefined
  deprecated?: boolean | undefined
  /** Merged path-level + operation-level parameters. */
  parameters: IrParameter[]
  /** Request body (if any). */
  requestBody?: IrBody | undefined
  /** Responses keyed by status code (e.g. `200`, `default`). */
  responses: IrResponse[]
  /** Security requirements that apply to this operation. */
  security?: Record<string, string[]>[] | undefined
}

export type IrParameter = {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean | undefined
  deprecated?: boolean | undefined
  description?: string | undefined
  /** Raw JSON Schema for the parameter value. */
  schema?: Record<string, unknown> | undefined
  /** Example value provided at the parameter level. */
  example?: unknown
}

export type IrBody = {
  required?: boolean | undefined
  description?: string | undefined
  /** Content keyed by media type (e.g. `application/json`). */
  content: IrMediaType[]
}

export type IrMediaType = {
  mediaType: string
  /** Raw JSON Schema for the media type. */
  schema?: Record<string, unknown> | undefined
  /** Example value(s), if provided. */
  example?: unknown
}

export type IrResponse = {
  /** Status code or `default`. */
  status: string
  description?: string | undefined
  content: IrMediaType[]
  /** Response headers, keyed by header name in the spec. */
  headers: IrHeader[]
}

export type IrHeader = {
  name: string
  required?: boolean | undefined
  deprecated?: boolean | undefined
  description?: string | undefined
  /** Raw JSON Schema for the header value. */
  schema?: Record<string, unknown> | undefined
  /** Example value provided at the header level. */
  example?: unknown
}

export type IrSecurityScheme = Record<string, unknown> & {
  type: string
  description?: string | undefined
}

/** Minimal structural typing for the dereferenced OpenAPI 3.1 document we read. */
type Document = {
  info?: { title?: string; version?: string; description?: string }
  servers?: { url?: string; description?: string }[]
  tags?: { name?: string; description?: string }[]
  paths?: Record<string, PathItem>
  components?: { securitySchemes?: Record<string, IrSecurityScheme> }
  security?: Record<string, string[]>[]
}
type PathItem = Record<string, unknown> & {
  parameters?: RawParameter[]
} & Partial<Record<Method, Operation>>
type Operation = {
  operationId?: string
  summary?: string
  description?: string
  deprecated?: boolean
  tags?: string[]
  parameters?: RawParameter[]
  requestBody?: RawBody
  responses?: Record<string, RawResponse>
  security?: Record<string, string[]>[]
}
type RawParameter = {
  name?: string
  in?: string
  required?: boolean
  deprecated?: boolean
  description?: string
  schema?: Record<string, unknown>
  example?: unknown
}
type RawBody = {
  required?: boolean
  description?: string
  content?: Record<string, { schema?: Record<string, unknown>; example?: unknown }>
}
type RawResponse = {
  description?: string
  content?: Record<string, { schema?: Record<string, unknown>; example?: unknown }>
  headers?: Record<string, RawHeader>
}
type RawHeader = {
  required?: boolean
  deprecated?: boolean
  description?: string
  schema?: Record<string, unknown>
  example?: unknown
}

/**
 * Parses an OpenAPI spec into the Vocs intermediate representation.
 *
 * Loads the spec (inline object, file path, raw content, or URL), upgrades it
 * to OpenAPI 3.1, dereferences all `$ref`s, then groups operations into
 * categories (by tag) for the sidebar and per-category pages.
 */
export async function parse(config: OpenApi.Config, options: parse.Options = {}): Promise<Ir> {
  const { rootDir = typeof process !== 'undefined' ? process.cwd() : '.' } = options

  // Resolve a lazy provider or an already-started promise (e.g. a
  // runtime-generated spec) to its value.
  const input = typeof config.spec === 'function' ? config.spec() : config.spec
  const spec = await input

  const raw = await load(spec, rootDir)
  const { specification } = upgrade(raw as never)
  const { schema } = dereference(specification as never)
  const document = (schema ?? specification) as Document

  const isUrl =
    typeof spec === 'string' && (spec.startsWith('http://') || spec.startsWith('https://'))
  const specUrl = isUrl ? spec : undefined

  const servers = (document.servers ?? [])
    .map((server) => ({
      url: resolveServerUrl(server.url ?? '', specUrl),
      description: server.description,
    }))
    .filter((server) => server.url)

  const securitySchemes = document.components?.securitySchemes ?? {}

  const client = isUrl
    ? { url: spec as string }
    : { content: specification as Record<string, unknown> }

  return {
    path: config.path ?? '/',
    client,
    info: {
      title: document.info?.title ?? 'API Reference',
      version: document.info?.version,
      description: document.info?.description,
    },
    servers,
    groups: buildGroups(document),
    securitySchemes,
  }
}

export declare namespace parse {
  type Options = {
    /** Directory file-path specs are resolved against. @default process.cwd() */
    rootDir?: string | undefined
  }
}

/**
 * Resolves a server URL to an absolute one.
 *
 * OpenAPI server URLs are often relative (e.g. `/` or `/v2`), meaning "relative
 * to the host serving this document". When the spec was loaded from a URL we
 * resolve such URLs against that origin (matching how Scalar and other tools
 * behave) so generated code samples point at a real, callable host. Absolute
 * URLs are returned untouched; relative URLs for file/inline specs are kept
 * as-is. Any trailing slash is trimmed so callers can append paths directly.
 */
function resolveServerUrl(url: string, specUrl: string | undefined): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url.replace(/\/$/, '')
  if (!specUrl) return url
  try {
    return new URL(url, specUrl).toString().replace(/\/$/, '')
  } catch {
    return url
  }
}

/** Resolves a spec input to a raw definition (object or string content). */
async function load(
  spec: OpenApi.Spec,
  rootDir: string,
): Promise<Record<string, unknown> | string> {
  if (typeof spec === 'object') return spec as Record<string, unknown>

  if (spec.startsWith('http://') || spec.startsWith('https://')) {
    const response = await fetch(spec)
    if (!response.ok)
      throw new Error(`Failed to fetch OpenAPI spec from ${spec}: ${response.statusText}`)
    return response.text()
  }

  // Raw JSON/YAML content passed inline as a string — no filesystem needed.
  // (Avoids importing `node:*` in non-Node runtimes like Cloudflare Workers,
  // where local-file specs are unsupported anyway.)
  if (looksLikeRawContent(spec)) return spec

  // Treat as a file path relative to rootDir; fall back to raw content. `node:*`
  // is imported dynamically so URL/inline specs stay runtime-portable.
  try {
    const [{ default: fs }, path] = await Promise.all([
      import('node:fs/promises').then((module) => ({ default: module })),
      import('node:path'),
    ])
    const filePath = path.isAbsolute(spec) ? spec : path.resolve(rootDir, spec)
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return spec
  }
}

/**
 * Heuristic for raw inline spec content (vs. a file path): JSON starts with `{`,
 * and a YAML document typically contains a newline or an `openapi:`/`swagger:`
 * key. File paths are single-line and do not.
 */
function looksLikeRawContent(spec: string): boolean {
  const trimmed = spec.trimStart()
  if (trimmed.startsWith('{')) return true
  if (/\n/.test(spec) && /(^|\n)\s*(openapi|swagger)\s*:/.test(spec)) return true
  return false
}

/** Groups operations by their first tag. */
function buildGroups(document: Document): IrGroup[] {
  const slugger = new GithubSlugger()
  const order: string[] = []
  const byName = new Map<string, IrOperation[]>()
  const descriptions = new Map<string, string | undefined>()

  // Seed group order from document-level `tags` so authoring order is preserved.
  for (const tag of document.tags ?? []) {
    if (!tag.name) continue
    if (!byName.has(tag.name)) {
      byName.set(tag.name, [])
      order.push(tag.name)
      descriptions.set(tag.name, tag.description)
    }
  }

  const paths = document.paths ?? {}
  for (const [pathname, item] of Object.entries(paths)) {
    if (!item || typeof item !== 'object') continue
    const pathParameters = item.parameters ?? []

    for (const method of methods) {
      const operation = item[method]
      if (!operation) continue

      const groupName = operation.tags?.[0] ?? 'default'

      if (!byName.has(groupName)) {
        byName.set(groupName, [])
        order.push(groupName)
      }

      byName.get(groupName)?.push(
        buildOperation({
          method,
          pathname,
          operation,
          pathParameters,
          slugger,
        }),
      )
    }
  }

  return order
    .map((name) => ({
      id: slugger.slug(name),
      name,
      description: descriptions.get(name),
      operations: byName.get(name) ?? [],
    }))
    .filter((group) => group.operations.length > 0)
}

function buildOperation(options: {
  method: Method
  pathname: string
  operation: Operation
  pathParameters: RawParameter[]
  slugger: GithubSlugger
}): IrOperation {
  const { method, pathname, operation, pathParameters, slugger } = options

  const idSource = operation.operationId || `${method}-${pathname}`

  // Merge path-level parameters with operation-level (operation wins on conflict).
  const merged = new Map<string, RawParameter>()
  for (const parameter of [...pathParameters, ...(operation.parameters ?? [])]) {
    if (!parameter?.name || !parameter.in) continue
    merged.set(`${parameter.in}:${parameter.name}`, parameter)
  }

  return {
    id: slugger.slug(idSource),
    method: method.toUpperCase(),
    path: pathname,
    summary: operation.summary,
    description: operation.description,
    deprecated: operation.deprecated,
    parameters: [...merged.values()].map((parameter) => ({
      name: parameter.name as string,
      in: parameter.in as IrParameter['in'],
      required: parameter.required,
      deprecated: parameter.deprecated,
      description: parameter.description,
      schema: parameter.schema,
      example: parameter.example,
    })),
    requestBody: buildBody(operation.requestBody),
    responses: buildResponses(operation.responses),
    security: operation.security,
  }
}

function buildBody(body: RawBody | undefined): IrBody | undefined {
  if (!body) return undefined
  return {
    required: body.required,
    description: body.description,
    content: buildContent(body.content),
  }
}

function buildResponses(responses: Record<string, RawResponse> | undefined): IrResponse[] {
  if (!responses) return []
  return Object.entries(responses).map(([status, response]) => ({
    status,
    description: response?.description,
    content: buildContent(response?.content),
    headers: buildHeaders(response?.headers),
  }))
}

function buildHeaders(headers: Record<string, RawHeader> | undefined): IrHeader[] {
  if (!headers) return []
  return Object.entries(headers).map(([name, header]) => ({
    name,
    required: header?.required,
    deprecated: header?.deprecated,
    description: header?.description,
    schema: header?.schema,
    example: header?.example,
  }))
}

function buildContent(
  content: Record<string, { schema?: Record<string, unknown>; example?: unknown }> | undefined,
): IrMediaType[] {
  if (!content) return []
  return Object.entries(content).map(([mediaType, value]) => ({
    mediaType,
    schema: value?.schema,
    example: value?.example,
  }))
}
