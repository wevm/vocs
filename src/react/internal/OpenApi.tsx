import { cx } from 'cva'
import type { OpenAPIV3 } from 'openapi-types'

import type { Operation } from '../../internal/openapi.js'

// ---------------------------------------------------------------------------
// OpenApiOperation
// ---------------------------------------------------------------------------

export function OpenApiOperation(props: OpenApiOperation.Props) {
  const { operation } = props
  return (
    <div data-v-openapi data-v-content>
      {/* Header */}
      <div className="vocs:flex vocs:items-center vocs:gap-3 vocs:mb-6">
        <MethodBadge method={operation.method} />
        <code className="vocs:text-lg vocs:font-mono vocs:text-heading">{operation.path}</code>
        {operation.deprecated && (
          <span className="vocs:text-xs vocs:bg-red-500/10 vocs:text-red-600 vocs:px-2 vocs:py-0.5 vocs:rounded-md">
            Deprecated
          </span>
        )}
      </div>

      {/* Summary */}
      {operation.summary && !operation.description && (
        <p className="vocs:text-primary vocs:leading-relaxed vocs:mb-6">{operation.summary}</p>
      )}

      {/* Description */}
      {operation.description && (
        <p className="vocs:text-primary vocs:leading-relaxed vocs:mb-6">{operation.description}</p>
      )}

      {/* Parameters */}
      {operation.parameters.length > 0 && (
        <section className="vocs:mb-8">
          <h2 className="vocs:text-heading vocs:text-lg vocs:font-medium vocs:mb-4">Parameters</h2>
          <ParamTable parameters={operation.parameters} />
        </section>
      )}

      {/* Request Body */}
      {operation.requestBody && (
        <section className="vocs:mb-8">
          <h2 className="vocs:text-heading vocs:text-lg vocs:font-medium vocs:mb-4">
            Request Body
          </h2>
          <RequestBody requestBody={operation.requestBody} />
        </section>
      )}

      {/* Responses */}
      {Object.keys(operation.responses).length > 0 && (
        <section className="vocs:mb-8">
          <h2 className="vocs:text-heading vocs:text-lg vocs:font-medium vocs:mb-4">Responses</h2>
          <ResponseTable responses={operation.responses} />
        </section>
      )}
    </div>
  )
}

export declare namespace OpenApiOperation {
  type Props = {
    operation: Operation
  }
}

// ---------------------------------------------------------------------------
// MethodBadge
// ---------------------------------------------------------------------------

const methodColors: Record<string, string> = {
  get: 'vocs:bg-emerald-500/10 vocs:text-emerald-600',
  post: 'vocs:bg-blue-500/10 vocs:text-blue-600',
  put: 'vocs:bg-amber-500/10 vocs:text-amber-600',
  delete: 'vocs:bg-red-500/10 vocs:text-red-600',
  patch: 'vocs:bg-purple-500/10 vocs:text-purple-600',
}

const defaultMethodColor = 'vocs:bg-gray-500/10 vocs:text-gray-600'

export function MethodBadge(props: MethodBadge.Props) {
  const { method } = props
  const color = methodColors[method.toLowerCase()] ?? defaultMethodColor
  return (
    <span
      className={cx(
        'vocs:text-xs vocs:font-semibold vocs:font-mono vocs:uppercase vocs:px-2 vocs:py-1 vocs:rounded-md',
        color,
      )}
      data-v-openapi-method
      data-method={method.toLowerCase()}
    >
      {method.toUpperCase()}
    </span>
  )
}

export declare namespace MethodBadge {
  type Props = {
    method: string
  }
}

// ---------------------------------------------------------------------------
// ParamTable
// ---------------------------------------------------------------------------

export function ParamTable(props: ParamTable.Props) {
  const { parameters } = props
  return (
    <div className="vocs:overflow-x-auto" data-v-openapi-params>
      <table className="vocs:w-full vocs:text-sm vocs:border-collapse">
        <thead>
          <tr className="vocs:border-b vocs:border-primary">
            <th className="vocs:text-left vocs:text-secondary vocs:font-medium vocs:py-2 vocs:pr-4">
              Name
            </th>
            <th className="vocs:text-left vocs:text-secondary vocs:font-medium vocs:py-2 vocs:pr-4">
              In
            </th>
            <th className="vocs:text-left vocs:text-secondary vocs:font-medium vocs:py-2 vocs:pr-4">
              Type
            </th>
            <th className="vocs:text-left vocs:text-secondary vocs:font-medium vocs:py-2 vocs:pr-4">
              Required
            </th>
            <th className="vocs:text-left vocs:text-secondary vocs:font-medium vocs:py-2">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param) => (
            <tr key={param.name} className="vocs:border-b vocs:border-primary/50" data-v-openapi-param>
              <td className="vocs:py-2 vocs:pr-4 vocs:font-mono vocs:text-heading">{param.name}</td>
              <td className="vocs:py-2 vocs:pr-4">
                <span className="vocs:text-xs vocs:bg-gray-500/10 vocs:text-secondary vocs:px-1.5 vocs:py-0.5 vocs:rounded">
                  {param.in}
                </span>
              </td>
              <td className="vocs:py-2 vocs:pr-4 vocs:font-mono vocs:text-secondary">
                {getSchemaType(param.schema as OpenAPIV3.SchemaObject | undefined)}
              </td>
              <td className="vocs:py-2 vocs:pr-4">
                {param.required && (
                  <span className="vocs:text-xs vocs:bg-red-500/10 vocs:text-red-600 vocs:px-1.5 vocs:py-0.5 vocs:rounded">
                    required
                  </span>
                )}
              </td>
              <td className="vocs:py-2 vocs:text-primary">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export declare namespace ParamTable {
  type Props = {
    parameters: OpenAPIV3.ParameterObject[]
  }
}

// ---------------------------------------------------------------------------
// SchemaViewer
// ---------------------------------------------------------------------------

const maxSchemaDepth = 3

export function SchemaViewer(props: SchemaViewer.Props) {
  const { schema, depth = 0 } = props

  if (depth > maxSchemaDepth) return <span className="vocs:text-secondary vocs:italic">…</span>

  const properties = schema.properties ?? {}
  const required = new Set(schema.required ?? [])
  const entries = Object.entries(properties) as [string, OpenAPIV3.SchemaObject][]

  if (entries.length === 0) {
    return <span className="vocs:font-mono vocs:text-secondary">{getSchemaType(schema)}</span>
  }

  return (
    <div
      className={cx('vocs:flex vocs:flex-col vocs:gap-2', depth > 0 && 'vocs:pl-4 vocs:border-l vocs:border-primary/30')}
      data-v-openapi-schema
    >
      {entries.map(([name, propSchema]) => (
        <div key={name} className="vocs:flex vocs:flex-col vocs:gap-0.5">
          <div className="vocs:flex vocs:items-center vocs:gap-2">
            <span className="vocs:font-mono vocs:text-heading vocs:text-sm">{name}</span>
            <span className="vocs:font-mono vocs:text-xs vocs:text-secondary">
              {getSchemaType(propSchema)}
            </span>
            {required.has(name) && (
              <span className="vocs:text-[10px] vocs:bg-red-500/10 vocs:text-red-600 vocs:px-1 vocs:py-px vocs:rounded">
                required
              </span>
            )}
          </div>
          {propSchema.description && (
            <p className="vocs:text-xs vocs:text-primary vocs:leading-relaxed">
              {propSchema.description}
            </p>
          )}
          {propSchema.type === 'object' && propSchema.properties && (
            <SchemaViewer schema={propSchema} depth={depth + 1} />
          )}
          {propSchema.type === 'array' && propSchema.items && (propSchema.items as OpenAPIV3.SchemaObject).type === 'object' && (
            <SchemaViewer schema={propSchema.items as OpenAPIV3.SchemaObject} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  )
}

export declare namespace SchemaViewer {
  type Props = {
    schema: OpenAPIV3.SchemaObject
    depth?: number
  }
}

// ---------------------------------------------------------------------------
// RequestBody
// ---------------------------------------------------------------------------

export function RequestBody(props: RequestBody.Props) {
  const { requestBody } = props
  const contentEntries = Object.entries(requestBody.content ?? {})

  return (
    <div className="vocs:flex vocs:flex-col vocs:gap-4" data-v-openapi-request-body>
      {requestBody.description && (
        <p className="vocs:text-primary vocs:text-sm vocs:leading-relaxed">
          {requestBody.description}
        </p>
      )}
      {contentEntries.map(([contentType, mediaType]) => (
        <div key={contentType} className="vocs:flex vocs:flex-col vocs:gap-2">
          <span className="vocs:text-xs vocs:font-mono vocs:text-secondary vocs:bg-gray-500/10 vocs:px-2 vocs:py-0.5 vocs:rounded vocs:w-fit">
            {contentType}
          </span>
          {mediaType.schema && (
            <SchemaViewer schema={mediaType.schema as OpenAPIV3.SchemaObject} />
          )}
        </div>
      ))}
    </div>
  )
}

export declare namespace RequestBody {
  type Props = {
    requestBody: OpenAPIV3.RequestBodyObject
  }
}

// ---------------------------------------------------------------------------
// ResponseTable
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  '2': 'vocs:bg-emerald-500/10 vocs:text-emerald-600',
  '3': 'vocs:bg-blue-500/10 vocs:text-blue-600',
  '4': 'vocs:bg-amber-500/10 vocs:text-amber-600',
  '5': 'vocs:bg-red-500/10 vocs:text-red-600',
}

export function ResponseTable(props: ResponseTable.Props) {
  const { responses } = props
  return (
    <div className="vocs:flex vocs:flex-col vocs:gap-4" data-v-openapi-responses>
      {Object.entries(responses).map(([status, response]) => {
        const color = statusColors[status[0]!] ?? defaultMethodColor
        const schema = getResponseSchema(response)
        return (
          <div key={status} className="vocs:flex vocs:flex-col vocs:gap-2" data-v-openapi-response>
            <div className="vocs:flex vocs:items-center vocs:gap-3">
              <span
                className={cx(
                  'vocs:text-xs vocs:font-mono vocs:font-semibold vocs:px-2 vocs:py-0.5 vocs:rounded-md',
                  color,
                )}
              >
                {status}
              </span>
              {response.description && (
                <span className="vocs:text-sm vocs:text-primary">{response.description}</span>
              )}
            </div>
            {schema && <SchemaViewer schema={schema} />}
          </div>
        )
      })}
    </div>
  )
}

export declare namespace ResponseTable {
  type Props = {
    responses: Record<string, OpenAPIV3.ResponseObject>
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSchemaType(schema: OpenAPIV3.SchemaObject | undefined): string {
  if (!schema) return 'unknown'
  if (schema.type === 'array') {
    const items = schema.items as OpenAPIV3.SchemaObject | undefined
    return `array of ${getSchemaType(items)}`
  }
  if (schema.enum) return `${schema.type ?? 'string'} (enum)`
  return schema.type ?? 'object'
}

function getResponseSchema(
  response: OpenAPIV3.ResponseObject,
): OpenAPIV3.SchemaObject | undefined {
  const content = response.content
  if (!content) return undefined
  const mediaType =
    content['application/json'] ?? content[Object.keys(content)[0]!]
  return mediaType?.schema as OpenAPIV3.SchemaObject | undefined
}
