import { dereference, upgrade } from '@scalar/openapi-parser'
import GithubSlugger from 'github-slugger'
import type * as OpenApi from './openapi.js'
import * as OpenRpc from './openrpc.js'

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
  /**
   * Doc-only "trait" pages: tags marked `x-traitTag: true` (Redoc convention),
   * which carry Markdown `description` content but no operations. The standalone
   * handler renders each as a guide page nested under `Introduction`.
   */
  traits: IrTrait[]
  /** Named security schemes from `components.securitySchemes`. */
  securitySchemes: Record<string, IrSecurityScheme>
}

export type IrTrait = {
  /** Stable slug used as the page route segment. */
  id: string
  /** Display name (the page title fallback). */
  name: string
  /** Page body (Markdown). */
  description?: string | undefined
  /** Optional subtitle rendered under the title (`x-subtitle`). */
  subtitle?: string | undefined
  /**
   * Sidebar group to nest the page under (`x-parent`, a tag/group name). When
   * omitted, the page nests under `Introduction`. When it names an existing
   * operation group, the page joins that group; otherwise a new sidebar group
   * with that name is created.
   */
  parent?: string | undefined
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
  /**
   * Name of the host operation's request example to preselect in the
   * interactive client. Set for JSON-RPC operations expanded from an OpenRPC
   * document (the JSON-RPC method name); lets "Try" prefill the right envelope
   * even though every method shares the same path + verb.
   */
  rpcExample?: string | undefined
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
  /**
   * Where the parameter is supplied. `rpc` is a Vocs extension for JSON-RPC
   * method params expanded from an OpenRPC document (rendered like query/path
   * params but carried in the request body envelope).
   */
  in: 'path' | 'query' | 'header' | 'cookie' | 'rpc'
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
  /**
   * Suppress the rendered "Request Body" section while still using the body to
   * generate request code samples. Set for JSON-RPC operations expanded from an
   * OpenRPC document, whose params are shown in a "Parameters" section instead.
   */
  hidden?: boolean | undefined
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
  tags?: {
    name?: string
    description?: string
    'x-traitTag'?: boolean
    'x-subtitle'?: string
    'x-parent'?: string
  }[]
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
  /**
   * Vocs extension: a path/URL to (or inline) OpenRPC document. When present,
   * this single operation is expanded into one operation per JSON-RPC method.
   */
  'x-openrpc'?: string | OpenRpc.Document
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

  // Base for resolving relative `x-openrpc` URLs (e.g. `/openrpc.json`): the
  // spec URL when the spec was loaded from a URL, else the caller-provided base
  // (the request origin in the standalone server handler).
  const openrpcBaseUrl = specUrl ?? options.baseUrl

  const servers = (document.servers ?? [])
    .map((server) => ({
      url: resolveServerUrl(server.url ?? '', specUrl),
      description: server.description,
    }))
    .filter((server) => server.url)

  const securitySchemes = document.components?.securitySchemes ?? {}

  const { groups, injections } = await buildGroups(document, { baseUrl: openrpcBaseUrl })

  // Inject JSON-RPC examples onto the host operation in the spec the
  // interactive client loads, so each "Try" can preselect its method's
  // envelope. The examples must live in the document Scalar reads; when the
  // spec was a URL it would otherwise fetch the un-augmented version, so fall
  // back to handing it the augmented `content` instead.
  for (const injection of injections)
    injectRpcExamples(specification as Record<string, unknown>, injection)

  const client =
    isUrl && injections.length === 0
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
    groups,
    traits: buildTraits(document),
    securitySchemes,
  }
}

/**
 * Adds named JSON-RPC request examples to a host operation's
 * `application/json` request body in the (upgraded) spec document. Scalar
 * builds one selectable request example per key, which the "Try" button
 * navigates to via the operation's `rpcExample`.
 */
function injectRpcExamples(specification: Record<string, unknown>, injection: RpcInjection): void {
  const paths = specification['paths'] as Record<string, Record<string, unknown>> | undefined
  const operation = paths?.[injection.path]?.[injection.method] as
    | Record<string, unknown>
    | undefined
  if (!operation) return

  let requestBody = operation['requestBody'] as Record<string, unknown> | undefined
  // A `$ref`'d or absent body can't be merged in place; replace with an inline
  // one carrying just the examples (the params already render in the docs).
  if (!requestBody || typeof requestBody !== 'object' || '$ref' in requestBody) {
    requestBody = {}
    operation['requestBody'] = requestBody
  }
  if (!requestBody['content']) requestBody['content'] = {}
  const content = requestBody['content'] as Record<string, Record<string, unknown>>
  if (!content['application/json']) content['application/json'] = {}
  const media = content['application/json']
  media['examples'] = { ...(media['examples'] as Record<string, unknown>), ...injection.examples }
}

/** Builds doc-only "trait" pages from tags marked `x-traitTag: true`. */
function buildTraits(document: Document): IrTrait[] {
  const slugger = new GithubSlugger()
  const traits: IrTrait[] = []
  for (const tag of document.tags ?? []) {
    if (!tag.name || !tag['x-traitTag']) continue
    traits.push({
      id: slugger.slug(tag.name),
      name: tag.name,
      description: tag.description,
      subtitle: tag['x-subtitle'],
      parent: tag['x-parent'],
    })
  }
  return traits
}

export declare namespace parse {
  type Options = {
    /** Directory file-path specs are resolved against. @default process.cwd() */
    rootDir?: string | undefined
    /**
     * Base URL relative `x-openrpc` URLs (e.g. `/openrpc.json`) resolve against
     * when the spec itself wasn't loaded from a URL — the request origin in the
     * standalone server handler.
     */
    baseUrl?: string | undefined
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

/** A set of named JSON-RPC examples to inject onto a host spec operation. */
type RpcInjection = {
  path: string
  method: Method
  examples: Record<string, OpenRpc.expand.RpcExample>
}

type BuildGroupsResult = { groups: IrGroup[]; injections: RpcInjection[] }

/** Groups operations by their first tag. */
async function buildGroups(
  document: Document,
  options: { baseUrl?: string | undefined } = {},
): Promise<BuildGroupsResult> {
  const slugger = new GithubSlugger()
  const order: string[] = []
  const byName = new Map<string, IrOperation[]>()
  const descriptions = new Map<string, string | undefined>()
  const injections: RpcInjection[] = []

  // Seed group order from document-level `tags` so authoring order is preserved.
  // Skip `x-traitTag` tags — they're doc-only pages, not operation categories.
  for (const tag of document.tags ?? []) {
    if (!tag.name || tag['x-traitTag']) continue
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

      const built = buildOperation({
        method,
        pathname,
        operation,
        pathParameters,
        slugger,
      })

      // `x-openrpc` expands one operation into one operation per JSON-RPC method
      // (each its own sidebar entry/section). On failure, fall back to the
      // single host operation so the docs still render.
      if (operation['x-openrpc']) {
        try {
          const { operations, examples } = await OpenRpc.expand(built, operation['x-openrpc'], {
            baseUrl: options.baseUrl,
          })
          byName.get(groupName)?.push(...(operations.length > 0 ? operations : [built]))
          // Record the named JSON-RPC examples so the caller can inject them
          // onto the host operation in the spec handed to the interactive
          // client (Scalar selects the right one per "Try" click).
          if (operations.length > 0 && Object.keys(examples).length > 0)
            injections.push({ path: pathname, method, examples })
        } catch (error) {
          // Fall back to the single host operation so the docs still render, but
          // surface why the JSON-RPC methods are missing (e.g. a relative
          // `x-openrpc` URL with no base, or an unreachable document).
          console.warn(
            `[vocs] Failed to expand x-openrpc for ${method.toUpperCase()} ${pathname}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          )
          byName.get(groupName)?.push(built)
        }
      } else {
        byName.get(groupName)?.push(built)
      }
    }
  }

  const groups = order
    .map((name) => ({
      id: slugger.slug(name),
      name,
      description: descriptions.get(name),
      operations: byName.get(name) ?? [],
    }))
    .filter((group) => group.operations.length > 0)

  return { groups, injections }
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
