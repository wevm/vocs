import { dereference } from '@scalar/openapi-parser'
import GithubSlugger from 'github-slugger'
import type { IrOperation, IrParameter } from './parser.js'

/**
 * Minimal structural typing for the OpenRPC documents we expand. Only the
 * fields consumed during expansion are modeled; everything else is ignored.
 *
 * @see https://spec.open-rpc.org
 */
export type Document = {
  openrpc?: string
  info?: { title?: string; version?: string; description?: string }
  methods?: Method[]
  components?: { schemas?: Record<string, unknown> }
}

export type Method = {
  name: string
  summary?: string
  description?: string
  deprecated?: boolean
  params?: ContentDescriptor[]
  result?: ContentDescriptor
  examples?: Example[]
}

type ContentDescriptor = {
  name?: string
  summary?: string
  description?: string
  required?: boolean
  deprecated?: boolean
  schema?: Record<string, unknown>
}

type Example = {
  name?: string
  params?: { name?: string; value?: unknown }[]
  result?: { name?: string; value?: unknown }
}

/**
 * Expands an OpenRPC document into one {@link IrOperation} per JSON-RPC method,
 * modeled after a single host HTTP operation (the JSON-RPC endpoint).
 *
 * JSON-RPC methods all POST the same envelope to one endpoint, which OpenAPI
 * cannot express as distinct path items. Expanding at the IR level instead lets
 * each method become its own sidebar entry and page section while keeping the
 * shared transport: every generated operation reuses the host operation's
 * `method` (POST) and `path`, so request code samples target the real endpoint.
 *
 * Each method maps to:
 * - `summary` → the method name (the sidebar/section title)
 * - `description` → the method summary + description
 * - `parameters` (`in: 'rpc'`) → the JSON-RPC params, rendered like path/query
 *   params
 * - `requestBody` → the JSON-RPC request envelope, `hidden` from the body
 *   section but used to generate an accurate request code sample
 * - a `200` response → the JSON-RPC response envelope wrapping the method result
 */
export async function expand(
  host: IrOperation,
  document: Document | string,
): Promise<IrOperation[]> {
  const resolved = await resolve(document)
  const methods = resolved.methods ?? []
  const slugger = new GithubSlugger()

  return methods.map((method) => {
    const example = method.examples?.[0]

    const parameters: IrParameter[] = (method.params ?? []).map((param, index) => ({
      name: param.name ?? `param${index}`,
      in: 'rpc',
      required: param.required,
      deprecated: param.deprecated,
      description: param.description ?? param.summary,
      schema: param.schema,
      example: paramExample(param, index, example),
    }))

    // The wire-format example values (positional `params` array) used for the
    // request code sample and to fill in any params the examples omit.
    const paramValues = parameters.map((parameter) =>
      parameter.example !== undefined ? parameter.example : sampleFromSchema(parameter.schema),
    )

    const requestExample = {
      jsonrpc: '2.0',
      id: 1,
      method: method.name,
      params: paramValues,
    }

    const resultSchema = method.result?.schema
    const resultValue =
      example?.result?.value !== undefined ? example.result.value : sampleFromSchema(resultSchema)
    const responseExample = { jsonrpc: '2.0', id: 1, result: resultValue }

    const description = [method.summary, method.description].filter(Boolean).join('\n\n')

    return {
      id: slugger.slug(method.name),
      method: host.method,
      path: host.path,
      summary: method.name,
      description: description || undefined,
      deprecated: method.deprecated,
      parameters,
      requestBody: {
        required: true,
        // Hidden from the rendered "Request Body" section: the params already
        // appear in the "Parameters" section and the literal envelope shows in
        // the request code sample. The body is still used to build that sample.
        hidden: true,
        content: [
          {
            mediaType: 'application/json',
            schema: requestEnvelopeSchema(method),
            example: requestExample,
          },
        ],
      },
      responses: [
        {
          status: '200',
          description: method.result?.description ?? 'JSON-RPC response.',
          content: [
            {
              mediaType: 'application/json',
              schema: responseEnvelopeSchema(resultSchema),
              example: responseExample,
            },
          ],
          headers: [],
        },
      ],
    } satisfies IrOperation
  })
}

/** Resolves an OpenRPC source (URL, raw JSON, or object) to a dereferenced doc. */
async function resolve(document: Document | string): Promise<Document> {
  let raw: unknown = document
  if (typeof document === 'string') {
    const trimmed = document.trimStart()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const response = await fetch(document)
      if (!response.ok)
        throw new Error(`Failed to fetch OpenRPC document from ${document}: ${response.statusText}`)
      raw = await response.json()
    } else {
      raw = JSON.parse(document)
    }
  }
  // Dereference internal `$ref`s (`#/components/schemas/...`) so the renderer
  // sees concrete schemas, matching how the OpenAPI parser dereferences specs.
  const { schema } = await dereference(raw as never)
  return (schema ?? raw) as Document
}

/** JSON-RPC request envelope schema for a method (used only for code samples). */
function requestEnvelopeSchema(method: Method): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      jsonrpc: { type: 'string', const: '2.0' },
      id: { type: 'integer' },
      method: { type: 'string', const: method.name },
      params: {
        type: 'array',
        prefixItems: (method.params ?? []).map((param) => param.schema ?? {}),
      },
    },
    required: ['jsonrpc', 'method'],
  }
}

/** JSON-RPC response envelope schema wrapping a method's result schema. */
function responseEnvelopeSchema(
  resultSchema: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      jsonrpc: { type: 'string', const: '2.0' },
      id: { type: 'integer' },
      ...(resultSchema ? { result: resultSchema } : {}),
    },
  }
}

/** Looks up the example value for a param, by name then position. */
function paramExample(
  param: ContentDescriptor,
  index: number,
  example: Example | undefined,
): unknown {
  const entries = example?.params ?? []
  const byName = param.name ? entries.find((entry) => entry.name === param.name) : undefined
  const entry = byName ?? entries[index]
  return entry?.value
}

/**
 * Derives a representative value from a JSON Schema for methods/params that lack
 * authored examples. Intentionally small — prefers authored `example`/`default`/
 * `enum` values and otherwise falls back to a type-based placeholder.
 */
function sampleFromSchema(schema: Record<string, unknown> | undefined): unknown {
  if (!schema || typeof schema !== 'object') return undefined
  if ('example' in schema) return schema['example']
  if (Array.isArray(schema['examples']) && schema['examples'].length > 0)
    return schema['examples'][0]
  if ('default' in schema) return schema['default']
  if ('const' in schema) return schema['const']
  if (Array.isArray(schema['enum']) && schema['enum'].length > 0) return schema['enum'][0]

  const type = Array.isArray(schema['type']) ? schema['type'][0] : schema['type']
  switch (type) {
    case 'string':
      return 'string'
    case 'integer':
    case 'number':
      return 0
    case 'boolean':
      return true
    case 'array': {
      const items = schema['items'] as Record<string, unknown> | undefined
      const item = sampleFromSchema(items)
      return item === undefined ? [] : [item]
    }
    case 'object': {
      const properties = schema['properties'] as Record<string, Record<string, unknown>> | undefined
      if (!properties) return {}
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(properties)) result[key] = sampleFromSchema(value)
      return result
    }
    default:
      return undefined
  }
}
