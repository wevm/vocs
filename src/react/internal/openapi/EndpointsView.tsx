import type { ComponentType } from 'react'
import LucideChevronRight from '~icons/lucide/chevron-right'
import type { Ir } from '../../../internal/openapi/parser.js'
import { methodVariant } from '../../../internal/openapi/sidebar.js'
import { Badge } from '../../Badge.js'
import { Disclosure } from './Disclosure.client.js'

/**
 * Prop-driven domain/category accordion for an OpenAPI spec: each category
 * expands to its operations (method badge + summary), every entry linking to
 * that operation's anchor on its category page.
 *
 * Framework-agnostic — the caller supplies the parsed {@link Ir}, an `href`
 * mapper (so links resolve correctly under any mount), and an optional `Link`
 * component (the Vocs/Waku `Link` for the site, a plain `<a>` for the standalone
 * client).
 */
export function EndpointsView(props: EndpointsView.Props) {
  const { ir, href, Link = DefaultLink } = props
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
                    href={href(`${ir.path}/${category.id}#${operation.id}`)}
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

function DefaultLink(props: React.ComponentProps<'a'>) {
  return <a {...props} />
}

export declare namespace EndpointsView {
  type Props = {
    /** Parsed OpenAPI spec. */
    ir: Ir
    /** Maps a section-relative href to a final href (e.g. mount-prefixed). */
    href: (to: string) => string
    /** Link component. Defaults to a plain anchor. */
    Link?: ComponentType<React.ComponentProps<'a'>> | undefined
  }
}
