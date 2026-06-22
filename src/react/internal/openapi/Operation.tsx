import LucideChevronRight from '~icons/lucide/chevron-right'
import * as Markdown from '../../../internal/markdown.js'
import {
  mediaIdBase,
  requestBodyIdBase,
  responseIdBase,
  slug,
} from '../../../internal/openapi/anchors.js'
import type * as OpenApi from '../../../internal/openapi/index.js'
import { codeSamples, responseSamples } from '../../../internal/openapi/sample.js'
import { methodVariant } from '../../../internal/openapi/sidebar.js'
import { Badge } from '../../Badge.js'
import { CodeSample } from './CodeSample.client.js'
import { CollapsibleChildren } from './CollapsibleChildren.client.js'
import { Disclosure } from './Disclosure.client.js'
import { HeadingAnchor } from './HeadingAnchor.js'
import { TestRequestButton } from './Playground.client.js'
import {
  enumValues,
  PropertyRow,
  Schema,
  schemaExample,
  schemaMeta,
  typeLabel,
  UnionView,
  unionVariants,
} from './Schema.js'

const parameterGroups: { in: OpenApi.IrParameter['in']; title: string }[] = [
  { in: 'path', title: 'Path Parameters' },
  { in: 'query', title: 'Query Parameters' },
  { in: 'header', title: 'Header Parameters' },
  { in: 'cookie', title: 'Cookie Parameters' },
  // JSON-RPC method params (expanded from an OpenRPC document).
  { in: 'rpc', title: 'Parameters' },
]

export function Operation(props: Operation.Props) {
  const { operation, server, headingLevel = 3, separator = false } = props
  const title = operation.summary || `${operation.method} ${operation.path}`
  const Heading = `h${headingLevel}` as 'h2' | 'h3'

  const samples = codeSamples(operation, server)
  const responses = responseSamples(operation)

  return (
    <section
      data-v-openapi-operation
      data-separator={separator || undefined}
      data-deprecated={operation.deprecated || undefined}
    >
      {/* Header: title, endpoint, description. */}
      <div data-v-openapi-operation-header>
        <Heading data-v data-v-openapi-operation-title id={operation.id}>
          {title}
          {operation.deprecated && <Badge variant="warning">Deprecated</Badge>}
          <HeadingAnchor id={operation.id} />
        </Heading>
        <div data-v-openapi-endpoint>
          <Badge variant={methodVariant(operation.method)}>{operation.method}</Badge>
          <code data-v-openapi-endpoint-path>{operation.path}</code>
        </div>
        {operation.description && <Prose markdown={operation.description} />}
      </div>

      {/* Body: parameters, request body, responses. */}
      <div data-v-openapi-operation-body>
        {parameterGroups.map((group) => {
          const params = operation.parameters.filter((parameter) => parameter.in === group.in)
          if (params.length === 0) return null
          return (
            <Section key={group.in} id={`${operation.id}-${slug(group.title)}`} title={group.title}>
              <ParameterList parameters={params} idPrefix={operation.id} />
            </Section>
          )
        })}

        {operation.requestBody && !operation.requestBody.hidden && (
          <Section id={`${operation.id}-request-body`} title="Request Body">
            <Content
              content={operation.requestBody.content}
              idBase={requestBodyIdBase(operation.id)}
            />
          </Section>
        )}

        {operation.responses.length > 0 && (
          <Section id={`${operation.id}-responses`} title="Responses">
            <div data-v-openapi-responses>
              {operation.responses.map((response) => (
                <ResponseRow key={response.status} operationId={operation.id} response={response} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Aside: request/response sample. Sticky beside the docs on large
          screens; on small screens it moves directly below the header (above
          the body) via the grid template in openapi.css. */}
      {samples.length > 0 && (
        <div data-v-openapi-operation-aside>
          <CodeSample
            samples={samples}
            responses={responses}
            action={<TestRequestButton method={operation.method} path={operation.path} />}
          />
        </div>
      )}
    </section>
  )
}

export declare namespace Operation {
  type Props = {
    operation: OpenApi.IrOperation
    /** Base server URL used to build request code samples. */
    server?: string | undefined
    /**
     * Heading level for the operation title. Use `2` on per-category pages
     * (category name is `<h1>`) and `3` on the single-page layout (category is
     * `<h2>`).
     *
     * @default 3
     */
    headingLevel?: 2 | 3 | undefined
    /**
     * Renders a top border separating this operation from the previous one.
     * Pass `true` for every operation except the first.
     *
     * @default false
     */
    separator?: boolean | undefined
  }
}

function Section(props: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section data-v-openapi-section>
      <h3 data-v data-v-openapi-section-title id={props.id}>
        {props.title}
        <HeadingAnchor id={props.id} />
      </h3>
      {props.children}
    </section>
  )
}

function ParameterList(props: { parameters: OpenApi.IrParameter[]; idPrefix: string }) {
  return (
    <div data-v-openapi-params>
      {props.parameters.map((parameter) => {
        const union = unionVariants(parameter.schema)
        return (
          <PropertyRow
            key={parameter.name}
            id={`${props.idPrefix}-${slug(parameter.name)}`}
            name={parameter.name}
            type={union ? undefined : typeLabel(parameter.schema)}
            values={union ? undefined : enumValues(parameter.schema)}
            meta={union ? [] : schemaMeta(parameter.schema)}
            example={union ? undefined : parameterExample(parameter)}
            required={parameter.required}
            deprecated={parameter.deprecated}
            description={parameter.description}
          >
            {union ? (
              <UnionView union={union} depth={1} prefix={`${parameter.name}.`} />
            ) : (
              parameter.schema &&
              hasChildSchema(parameter.schema) && (
                <CollapsibleChildren>
                  <div data-v-openapi-children>
                    <Schema
                      schema={parameter.schema}
                      depth={1}
                      prefix={`${parameter.name}${parameter.schema['type'] === 'array' ? '[]' : ''}.`}
                    />
                  </div>
                </CollapsibleChildren>
              )
            )}
          </PropertyRow>
        )
      })}
    </div>
  )
}

/** Resolves a parameter/header example, preferring the item-level value. */
function parameterExample(parameter: {
  example?: unknown
  schema?: Record<string, unknown> | undefined
}): string | undefined {
  if (parameter.example !== undefined)
    return typeof parameter.example === 'string'
      ? parameter.example
      : JSON.stringify(parameter.example)
  return schemaExample(parameter.schema)
}

/** Whether a parameter's schema has nested object/array properties to expand. */
function hasChildSchema(schema: Record<string, unknown>): boolean {
  if (schema['properties']) return true
  if (schema['type'] === 'array' && schema['items'])
    return hasChildSchema(schema['items'] as Record<string, unknown>)
  return false
}

function Content(props: {
  content: OpenApi.IrMediaType[]
  hideMediaType?: boolean
  idBase?: string | undefined
}) {
  if (props.content.length === 0) return null
  return (
    <div data-v-openapi-content>
      {props.content.map((media) => {
        const schemaIdBase = props.idBase
          ? mediaIdBase(props.idBase, media.mediaType, props.content.length)
          : undefined
        return (
          <div key={media.mediaType} data-v-openapi-media>
            {!props.hideMediaType && <code data-v-openapi-media-type>{media.mediaType}</code>}
            {media.schema ? (
              <Schema schema={media.schema} idBase={schemaIdBase} />
            ) : media.example !== undefined ? (
              <Example value={media.example} />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function ResponseRow(props: { operationId: string; response: OpenApi.IrResponse }) {
  const { operationId, response } = props
  const headers = response.headers ?? []
  const idBase = responseIdBase(operationId, response.status)
  const variant =
    response.status.startsWith('2') || response.status === 'default'
      ? 'success'
      : response.status.startsWith('4') || response.status.startsWith('5')
        ? 'danger'
        : 'info'
  const hasContent = response.content.length > 0 || headers.length > 0
  const header = (
    <>
      {hasContent ? (
        <LucideChevronRight data-v-openapi-response-chevron />
      ) : (
        <span data-v-openapi-response-spacer aria-hidden />
      )}
      <Badge variant={variant} data-v-openapi-response-status>
        {response.status}
      </Badge>
      {response.description && (
        <span data-v-openapi-response-description title={response.description}>
          {response.description}
        </span>
      )}
    </>
  )

  // Responses without a body have nothing to expand — render a static row.
  if (!hasContent)
    return (
      <div data-v-openapi-response data-static>
        {header}
      </div>
    )

  return (
    <div data-v-openapi-response>
      <Disclosure trigger={header}>
        <div data-v-openapi-response-content>
          {headers.length > 0 && (
            <CollapsibleChildren label="Headers">
              <div data-v-openapi-params>
                {headers.map((item) => (
                  <PropertyRow
                    key={item.name}
                    name={item.name}
                    type={typeLabel(item.schema)}
                    values={enumValues(item.schema)}
                    meta={schemaMeta(item.schema)}
                    example={parameterExample(item)}
                    required={item.required}
                    deprecated={item.deprecated}
                    description={item.description}
                  />
                ))}
              </div>
            </CollapsibleChildren>
          )}
          {response.content.length > 0 && (
            <Content content={response.content} hideMediaType idBase={idBase} />
          )}
        </div>
      </Disclosure>
    </div>
  )
}

function Example(props: { value: unknown }) {
  return (
    <pre data-v-openapi-example>
      <code>{JSON.stringify(props.value, null, 2)}</code>
    </pre>
  )
}

function Prose(props: { markdown: string }) {
  return (
    <div
      data-v-openapi-prose
      data-v-content
      // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered trusted spec content
      dangerouslySetInnerHTML={{ __html: Markdown.toHtml(props.markdown) }}
    />
  )
}
