import { specs } from 'virtual:vocs/openapi'
import LucideChevronRight from '~icons/lucide/chevron-right'
import { methodVariant } from '../../../internal/openapi/sidebar.js'
import { Badge } from '../../Badge.js'
import { Link } from '../../Link.js'
import { Disclosure } from './Disclosure.client.js'

/**
 * Renders the domain/category list for an OpenAPI spec as an accordion: each
 * category expands to its operations (method badge + summary), every entry
 * linking to that operation's anchor on its category page.
 *
 * This is an opt-in component — OpenAPI landing pages no longer render the list
 * automatically. Drop `<Endpoints />` into a consumer override page (e.g.
 * `pages/api.mdx`) to surface it.
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
    <div data-v-openapi-overview>
      {ir.groups.map((category) => (
        <div key={category.id} data-v-openapi-overview-category>
          <Disclosure
            trigger={
              <>
                <LucideChevronRight data-v-openapi-overview-chevron />
                <span data-v-openapi-overview-category-head>
                  <span data-v-openapi-overview-category-name>{category.name}</span>
                  {category.description && (
                    <span data-v-openapi-overview-category-description>{category.description}</span>
                  )}
                </span>
              </>
            }
          >
            <ul data-v-openapi-overview-endpoints>
              {category.operations.map((operation) => (
                <li key={operation.id}>
                  <Link
                    to={`${ir.path}/${category.id}#${operation.id}`}
                    data-v-openapi-overview-endpoint
                  >
                    <Badge variant={methodVariant(operation.method)}>{operation.method}</Badge>
                    <span data-v-openapi-overview-endpoint-title>
                      {operation.summary || operation.path}
                    </span>
                    <LucideChevronRight data-v-openapi-overview-endpoint-chevron />
                  </Link>
                </li>
              ))}
            </ul>
          </Disclosure>
        </div>
      ))}
    </div>
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
