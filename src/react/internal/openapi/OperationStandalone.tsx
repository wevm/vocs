import { specs } from 'virtual:vocs/openapi'
import { findOperation } from './find-operation.js'
import { Operation as OperationView } from './Operation.js'
import { PlaygroundProvider } from './Playground.client.js'

/**
 * Renders a single OpenAPI operation — the same block used on the auto-generated
 * category pages, including the sticky right-column request/response code sample
 * and its interactive "Try" playground (Vite/RSC site integration).
 *
 * This is an opt-in component for embedding one endpoint inside an authored MDX
 * page (e.g. a guide). Drop `<OpenApi.Operation operationId="getAddresses" />`
 * (or target it by `method` + `path`) wherever you want the endpoint to appear.
 *
 * The target operation is located by either:
 * - `operationId` — matched against the operation's anchor id (the slugified
 *   `operationId` from the spec), or
 * - `method` + `path` — matched against the HTTP method and templated path
 *   (e.g. `method="GET" path="/v1/addresses/{address}"`).
 *
 * The spec is resolved from `spec` (the OpenAPI mount, e.g. `/api`). When
 * omitted, it defaults to the only configured spec; if multiple specs exist,
 * `spec` is required.
 */
export function Operation(props: Operation.Props) {
  const mounts = Object.keys(specs)
  const mount = props.spec ?? (mounts.length === 1 ? mounts[0] : undefined)

  if (!mount) {
    if (mounts.length === 0) return <p>No OpenAPI spec is configured.</p>
    return (
      <p>
        Multiple OpenAPI specs are configured. Pass a <code>spec</code> to{' '}
        <code>&lt;Operation /&gt;</code> (one of: {mounts.join(', ')}).
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

  return (
    <div data-v-openapi>
      <PlaygroundProvider client={ir.client} mount={ir.path}>
        <OperationView
          operation={operation}
          server={ir.servers[0]?.url}
          headingLevel={props.headingLevel ?? 2}
          anchors={props.anchors}
          hideQueryParams={props.hideQueryParams}
        />
      </PlaygroundProvider>
    </div>
  )
}

export declare namespace Operation {
  type Props = {
    /**
     * OpenAPI mount path identifying which spec to read (e.g. `/api`).
     * Optional when only one spec is configured.
     */
    spec?: string | undefined
    /**
     * Target operation by its anchor id — the slugified `operationId` from the
     * spec (e.g. `operationId="getAddresses"`). Mutually exclusive with
     * `method` + `path`.
     */
    operationId?: string | undefined
    /** HTTP method of the target operation (e.g. `GET`). Pairs with `path`. */
    method?: string | undefined
    /** Templated path of the target operation (e.g. `/v1/addresses/{address}`). Pairs with `method`. */
    path?: string | undefined
    /** Heading level for the operation title (`2` or `3`). Defaults to `2`. */
    headingLevel?: 2 | 3 | undefined
    /**
     * Render the clickable schema cross-links in the request/response code
     * samples (the hover-highlighted spans/lines that jump to a parameter or
     * property row). Set `false` for static, non-interactive samples.
     *
     * @default true
     */
    anchors?: boolean | undefined
    /**
     * Omit query parameters from the generated request code sample.
     *
     * @default false
     */
    hideQueryParams?: boolean | undefined
  }
}
