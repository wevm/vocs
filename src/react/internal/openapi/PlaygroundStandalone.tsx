import { specs } from 'virtual:vocs/openapi'
import { codeSamples, responseSamples } from '../../../internal/openapi/sample.js'
import { CodeSample } from './CodeSample.client.js'
import { findOperation } from './find-operation.js'
import { PlaygroundProvider, TestRequestButton } from './Playground.client.js'

/**
 * Renders just the interactive request/response code sample for a single
 * OpenAPI operation — the bordered "playground" box (the cURL/response viewer
 * with Copy, "Try", and per-status tabs) that normally sits in the right column
 * of a generated operation page, with none of the surrounding documentation.
 *
 * This is an opt-in component for dropping the playground box into an authored
 * MDX page. For the full operation block (title, parameters, responses, and this
 * box together) use {@link file://./OperationStandalone.tsx `<OpenApi.Operation />`}.
 *
 * The target operation is located by either:
 * - `operationId` — matched against the operation's anchor id (the slugified
 *   `operationId` from the spec), or
 * - `method` + `path` — matched against the HTTP method and templated path
 *   (e.g. `method="GET" path="/v1/blocks"`).
 *
 * The spec is resolved from `spec` (the OpenAPI mount, e.g. `/api`). When
 * omitted, it defaults to the only configured spec; if multiple specs exist,
 * `spec` is required.
 */
export function Playground(props: Playground.Props) {
  const mounts = Object.keys(specs)
  const mount = props.spec ?? (mounts.length === 1 ? mounts[0] : undefined)

  if (!mount) {
    if (mounts.length === 0) return <p>No OpenAPI spec is configured.</p>
    return (
      <p>
        Multiple OpenAPI specs are configured. Pass a <code>spec</code> to{' '}
        <code>&lt;Playground /&gt;</code> (one of: {mounts.join(', ')}).
      </p>
    )
  }

  const ir = specs[mount]
  if (!ir) return <p>No OpenAPI spec is mounted at {mount}.</p>

  const operation = findOperation(ir, props)
  if (!operation)
    return (
      <p>
        No matching operation found in the API mounted at {mount}. Pass an <code>operationId</code>,
        or a <code>method</code> and <code>path</code>.
      </p>
    )

  const samples = codeSamples(operation, ir.servers[0]?.url, {
    hideQueryParams: props.hideQueryParams,
  })
  if (samples.length === 0) return null
  const responses = responseSamples(operation)

  return (
    <div data-v-openapi>
      <PlaygroundProvider client={ir.client} mount={ir.path}>
        <CodeSample
          samples={samples}
          responses={responses}
          anchors={props.anchors}
          action={
            <TestRequestButton
              method={operation.method}
              path={operation.path}
              example={operation.rpcExample}
            />
          }
        />
      </PlaygroundProvider>
    </div>
  )
}

export declare namespace Playground {
  type Props = {
    /**
     * OpenAPI mount path identifying which spec to read (e.g. `/api`).
     * Optional when only one spec is configured.
     */
    spec?: string | undefined
    /**
     * Target operation by its anchor id — the slugified `operationId` from the
     * spec (e.g. `operationId="getBlocks"`). Mutually exclusive with
     * `method` + `path`.
     */
    operationId?: string | undefined
    /** HTTP method of the target operation (e.g. `GET`). Pairs with `path`. */
    method?: string | undefined
    /** Templated path of the target operation (e.g. `/v1/blocks`). Pairs with `method`. */
    path?: string | undefined
    /**
     * Render the clickable schema cross-links in the request/response sample
     * (the hover-highlighted spans/lines that jump to a parameter or property
     * row). Set `false` for a static, non-interactive sample.
     *
     * @default true
     */
    anchors?: boolean | undefined
    /**
     * Omit query parameters from the generated request sample.
     *
     * @default false
     */
    hideQueryParams?: boolean | undefined
  }
}
