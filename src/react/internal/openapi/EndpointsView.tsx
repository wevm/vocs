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
  const { ir, href, Link = DefaultLink, resource } = props
  // Root-mounted specs have `ir.path === '/'`; collapse it to '' so links read
  // `/group#op` instead of `//group#op` (which the browser treats as a host).
  const base = ir.path === '/' ? '' : ir.path.replace(/\/$/, '')

  // `resource` renders a single category's operations as a flat list (no
  // accordion). Match by stable `id` first, then case-insensitively by `name`.
  if (resource !== undefined) {
    const category = ir.groups.find(
      (group) => group.id === resource || group.name.toLowerCase() === resource.toLowerCase(),
    )
    if (!category)
      return (
        <p>
          No resource named <code>{resource}</code> found.
        </p>
      )
    return (
      <ul data-v-openapi-overview-endpoints data-v-openapi-overview-resource>
        {category.operations.map((operation) => (
          <EndpointItem
            key={operation.id}
            Link={Link}
            href={href(`${base}/${category.id}#${operation.id}`)}
            operation={operation}
          />
        ))}
      </ul>
    )
  }

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
                <EndpointItem
                  key={operation.id}
                  Link={Link}
                  href={href(`${base}/${category.id}#${operation.id}`)}
                  operation={operation}
                />
              ))}
            </ul>
          </Disclosure>
        </div>
      ))}
    </div>
  )
}

function EndpointItem(props: {
  Link: ComponentType<React.ComponentProps<'a'>>
  href: string
  operation: Ir['groups'][number]['operations'][number]
}) {
  const { Link, href, operation } = props
  return (
    <li>
      <Link href={href} data-v-openapi-overview-endpoint>
        <Badge variant={methodVariant(operation.method)}>{operation.method}</Badge>
        <span data-v-openapi-overview-endpoint-title>{operation.summary || operation.path}</span>
        <LucideChevronRight data-v-openapi-overview-endpoint-chevron />
      </Link>
    </li>
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
    /**
     * Renders a single category's operations as a flat list (no accordion).
     * Matches a category by its `id`, or case-insensitively by `name`.
     */
    resource?: string | undefined
  }
}
