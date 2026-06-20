import { specs } from 'virtual:vocs/openapi'
import LucideChevronRight from '~icons/lucide/chevron-right'
import * as Markdown from '../../../internal/markdown.js'
import type { Ir } from '../../../internal/openapi/parser.js'
import { methodVariant } from '../../../internal/openapi/sidebar.js'
import { Badge } from '../../Badge.js'
import { Layout } from '../../Layout.js'
import { Link } from '../../Link.js'
import * as MdxPageContext from '../../MdxPageContext.js'
import { Disclosure } from './Disclosure.client.js'
import { HeadingAnchor } from './HeadingAnchor.js'
import { Operation } from './Operation.js'
import { PlaygroundProvider } from './Playground.client.js'

/**
 * Layout for OpenAPI pages. Disables the page outline (right gutter / table of
 * contents) via frontmatter context, since the sidebar already exposes every
 * operation as an anchor.
 */
function OpenApiLayout(props: { children: React.ReactNode; width?: 'default' | 'full' }) {
  return (
    <MdxPageContext.Provider
      frontmatter={{ outline: false, content: { width: props.width ?? 'full' } }}
    >
      <Layout>{props.children}</Layout>
    </MdxPageContext.Provider>
  )
}

/**
 * Renders an isolated, auto-generated OpenAPI reference section.
 *
 * Behavior depends on the optional `group` prop:
 *
 * - with `group`: renders a single category page (category name is `<h1>`,
 *   operations are `<h2>`).
 * - without `group`: renders an overview/landing page listing the categories.
 */
export function OpenApiPage(props: OpenApiPage.Props) {
  const ir = specs[props.mount]

  if (!ir)
    return (
      <OpenApiLayout>
        <p>No OpenAPI spec is mounted at {props.mount}.</p>
      </OpenApiLayout>
    )

  const group = props.group
    ? ir.groups.find((candidate) => candidate.id === props.group)
    : undefined

  // Single category page.
  if (props.group) {
    if (!group)
      return (
        <OpenApiLayout>
          <p>
            No category “{props.group}” exists in the API mounted at {props.mount}.
          </p>
        </OpenApiLayout>
      )

    return (
      <OpenApiLayout>
        <title>{`${group.name} · ${ir.info.title}`}</title>
        <PlaygroundProvider client={ir.client}>
          <div data-v-openapi>
            <header data-v-openapi-header>
              <h1 data-v data-v-openapi-h1 id={group.id}>
                {group.name}
                <HeadingAnchor id={group.id} />
              </h1>
              {group.description && <Prose markdown={group.description} />}
            </header>
            {group.operations.map((operation, index) => (
              <Operation
                key={operation.id}
                operation={operation}
                server={ir.servers[0]?.url}
                headingLevel={2}
                separator={index > 0}
              />
            ))}
          </div>
        </PlaygroundProvider>
      </OpenApiLayout>
    )
  }

  // Overview / landing page listing every category. Centered (content width)
  // rather than full-bleed — it has no two-column playground to fill the page.
  return (
    <OpenApiLayout width="default">
      <title>{ir.info.title}</title>
      <div data-v-openapi>
        <Header ir={ir} />
        <div data-v-openapi-group>
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
                          <span data-v-openapi-overview-category-description>
                            {category.description}
                          </span>
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
                          <Badge variant={methodVariant(operation.method)}>
                            {operation.method}
                          </Badge>
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
        </div>
      </div>
    </OpenApiLayout>
  )
}

export declare namespace OpenApiPage {
  type Props = {
    /** Mount path identifying which spec to render (e.g. `/api`). */
    mount: string
    /**
     * Category id to render. When omitted, renders the overview page listing
     * every category.
     */
    group?: string | undefined
  }
}

/**
 * Renders trusted markdown from the spec (info/category descriptions) with the
 * same typography as MDX content by marking the container `data-v-content` —
 * `Markdown.toHtml` already tags child elements with `data-v`.
 */
function Prose(props: { markdown: string }) {
  return (
    <div
      data-v-openapi-description
      data-v-content
      // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered trusted spec content
      dangerouslySetInnerHTML={{ __html: Markdown.toHtml(props.markdown) }}
    />
  )
}

function Header(props: { ir: Ir }) {
  const { ir } = props
  return (
    <header data-v-openapi-header>
      <h1 data-v data-v-openapi-info-title>
        {ir.info.title}
      </h1>
      {ir.info.description && <Prose markdown={ir.info.description} />}
    </header>
  )
}
