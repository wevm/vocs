import { specs } from 'virtual:vocs/openapi'
import { Link } from '../../Link.js'
import { EndpointsView } from './EndpointsView.js'

/**
 * Renders the domain/category list for an OpenAPI spec as an accordion (Vite/RSC
 * site integration). The UI lives in the framework-agnostic
 * {@link file://./EndpointsView.tsx `EndpointsView`}; this is the Waku adapter
 * that resolves the spec from `virtual:vocs/openapi` and links with the Vocs
 * `Link`.
 *
 * This is an opt-in component — OpenAPI landing pages no longer render the list
 * automatically. Drop `<OpenApi.Endpoints />` into a consumer override page
 * (e.g. `pages/api.mdx`) to surface it.
 *
 * The target spec is resolved from `path` (the OpenAPI mount, e.g. `/api`).
 * When omitted, it defaults to the only configured spec; if multiple specs
 * exist, `path` is required.
 */
export function Endpoints(props: Endpoints.Props) {
  const mounts = Object.keys(specs)
  const mount = props.path ?? (mounts.length === 1 ? mounts[0] : undefined)

  if (!mount) {
    if (mounts.length === 0) return <p>No OpenAPI spec is configured.</p>
    return (
      <p>
        Multiple OpenAPI specs are configured. Pass a <code>path</code> to{' '}
        <code>&lt;Endpoints /&gt;</code> (one of: {mounts.join(', ')}).
      </p>
    )
  }

  const ir = specs[mount]
  if (!ir) return <p>No OpenAPI spec is mounted at {mount}.</p>

  return (
    <EndpointsView
      ir={ir}
      href={(to) => to}
      Link={({ href, children, ...rest }) => (
        <Link to={href ?? ''} {...rest}>
          {children}
        </Link>
      )}
    />
  )
}

export declare namespace Endpoints {
  type Props = {
    /**
     * OpenAPI mount path identifying which spec to render (e.g. `/api`).
     * Optional when only one spec is configured.
     */
    path?: string | undefined
  }
}
