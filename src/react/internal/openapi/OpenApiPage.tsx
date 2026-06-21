import { specs } from 'virtual:vocs/openapi'
import type { ReactNode } from 'react'
import { Layout } from '../../Layout.js'
import * as MdxPageContext from '../../MdxPageContext.js'
import { Endpoints } from './Endpoints.js'
import { PlaygroundProvider } from './Playground.client.js'
import { Prose, ReferenceGroup, ReferenceOverview } from './Reference.js'

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
 * OpenAPI section path, e.g. `pages/api/auth.mdx`) as a standard Vocs content
 * page: the shared `Layout` `<article>` is the content container, so it owns the
 * page padding and content-width cap exactly like a regular markdown page (no
 * right gutter/TOC, via the `outline: false` frontmatter above).
 *
 * Unlike the section landing/group pages — which are full-bleed so their
 * two-column operation layout has room — a guide is pure prose, so it uses the
 * default (padded, content-width) article rather than a full-bleed wrapper.
 */
export function OpenApiGuide(props: OpenApiGuide.Props) {
  return (
    <OpenApiLayout width="default">
      {props.title ? <title>{props.title}</title> : null}
      {props.title || props.description ? (
        <header data-v-openapi-header>
          {props.title ? (
            <h1 data-v data-v-openapi-h1>
              {props.title}
            </h1>
          ) : null}
          {props.description ? <Prose markdown={props.description} attr="description" /> : null}
        </header>
      ) : null}
      {props.children}
    </OpenApiLayout>
  )
}

export declare namespace OpenApiGuide {
  type Props = {
    /** Authored MDX content. */
    children?: ReactNode | undefined
    /** Document `<title>` and page heading (from the page's frontmatter). */
    title?: string | undefined
    /** Subtitle Markdown rendered below the heading. */
    description?: string | undefined
  }
}

/**
 * Renders an isolated, auto-generated OpenAPI reference section (Vite/RSC site
 * integration). The actual content is rendered by the framework-agnostic
 * {@link file://./Reference.tsx `Reference`} components; this is the Waku
 * adapter that resolves the spec from `virtual:vocs/openapi` and wraps it in the
 * site `Layout`.
 *
 * Behavior depends on the optional `group` prop:
 *
 * - with `group`: renders a single category page.
 * - without `group`: renders an overview/landing page.
 *
 * An optional `intro` (a consumer-authored MDX "override" page mounted at the
 * same route) replaces the auto-generated header while the generated body still
 * renders below it automatically.
 */
export function OpenApiPage(props: OpenApiPage.Props) {
  const ir = specs[props.mount]

  if (!ir)
    return (
      <OpenApiLayout>
        <p>No OpenAPI spec is mounted at {props.mount}.</p>
      </OpenApiLayout>
    )

  // Single category page.
  if (props.group) {
    const group = ir.groups.find((candidate) => candidate.id === props.group)
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
          <ReferenceGroup ir={ir} group={group} intro={props.intro} />
        </PlaygroundProvider>
      </OpenApiLayout>
    )
  }

  // Overview / landing page.
  return (
    <OpenApiLayout width="full">
      <title>{props.title ?? ir.info.title}</title>
      <ReferenceOverview
        ir={ir}
        intro={props.intro}
        endpoints={props.endpoints ? <Endpoints path={ir.path || undefined} /> : undefined}
      />
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
    /**
     * Render the domain/endpoint list on the overview page (ignored when `group`
     * or `intro` is set). The standalone handler enables this so its
     * Introduction lists every endpoint by default.
     */
    endpoints?: boolean | undefined
  }
}
