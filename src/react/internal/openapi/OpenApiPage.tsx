import { specs } from 'virtual:vocs/openapi'
import type { ReactNode } from 'react'
import * as Markdown from '../../../internal/markdown.js'
import type { Ir } from '../../../internal/openapi/parser.js'
import { Layout } from '../../Layout.js'
import * as MdxPageContext from '../../MdxPageContext.js'
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
 * Renders a consumer-authored "guide" page (a normal MDX page mounted under an
 * OpenAPI section path, e.g. `pages/api/auth.mdx`) with the same layout as the
 * generated section: full-bleed (left gutter collapsed), no right gutter/TOC,
 * and content-width markdown — matching the section landing/intro pages.
 */
export function OpenApiGuide(props: OpenApiGuide.Props) {
  return (
    <OpenApiLayout width="full">
      {props.title ? <title>{props.title}</title> : null}
      <div data-v-openapi data-v-openapi-landing>
        <div data-v-openapi-intro data-v-content>
          {props.children}
        </div>
      </div>
    </OpenApiLayout>
  )
}

export declare namespace OpenApiGuide {
  type Props = {
    /** Authored MDX content. */
    children?: ReactNode | undefined
    /** Document `<title>` (from the page's frontmatter). */
    title?: string | undefined
  }
}

/**
 * Renders an isolated, auto-generated OpenAPI reference section.
 *
 * Behavior depends on the optional `group` prop:
 *
 * - with `group`: renders a single category page (category name is `<h1>`,
 *   operations are `<h2>`).
 * - without `group`: renders an overview/landing page listing the categories.
 *
 * An optional `intro` (a consumer-authored MDX "override" page mounted at the
 * same route) replaces the auto-generated header (spec title/description) while
 * the generated body — the category accordion (overview) or the operations list
 * (group) — still renders below it automatically.
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
        <title>{props.title ?? `${group.name} · ${ir.info.title}`}</title>
        <PlaygroundProvider client={ir.client}>
          <div data-v-openapi>
            {props.intro ? (
              // The override keeps the `group.id` anchor so the sidebar
              // "Overview" link and scroll-spy still resolve to this page. It
              // intentionally omits `data-v-openapi-header` (which sets
              // `text-h1` on the container for the auto title) — the authored
              // MDX supplies its own headings and body text.
              <div data-v-openapi-intro data-v-content id={group.id}>
                {props.intro}
              </div>
            ) : (
              <header data-v-openapi-header>
                <h1 data-v data-v-openapi-h1 id={group.id}>
                  {group.name}
                  <HeadingAnchor id={group.id} />
                </h1>
                {group.description && <Prose markdown={group.description} />}
              </header>
            )}
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

  // Overview / landing page. Renders only the consumer override (or the
  // auto-generated spec header). The domain/endpoint list is no longer rendered
  // automatically — consumers opt in by dropping `<Endpoints />` into an
  // override page. Uses the same gutter collapse as group pages (no left
  // gutter) but caps its own width to content width.
  return (
    <OpenApiLayout width="full">
      <title>{props.title ?? ir.info.title}</title>
      <div data-v-openapi data-v-openapi-landing>
        {props.intro ? (
          <div data-v-openapi-intro data-v-content>
            {props.intro}
          </div>
        ) : (
          <Header ir={ir} />
        )}
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
    /**
     * Consumer-authored override content rendered in place of the auto-generated
     * header (spec title/description). The generated body still renders below.
     */
    intro?: ReactNode | undefined
    /** Document `<title>` override (e.g. from the override page's frontmatter). */
    title?: string | undefined
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
