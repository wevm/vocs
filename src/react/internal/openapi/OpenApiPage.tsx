import { specs } from 'virtual:vocs/openapi'
import type { ReactNode } from 'react'
import { Layout } from '../../Layout.js'
import * as MdxPageContext from '../../MdxPageContext.js'
import { Endpoints } from './Endpoints.js'
import { HeadingAnchor } from './HeadingAnchor.js'
import { PlaygroundProvider } from './Playground.client.js'
import { Prose, ReferenceGroup, ReferenceOverview } from './Reference.js'

/**
 * Layout for OpenAPI pages.
 *
 * Single-column pages (the overview and consumer guide pages) show the normal
 * outline (the regular Vocs right gutter) — this is the default. The two-column
 * operation (category) pages opt out (`outline={false}`), since the sidebar
 * already exposes every operation as an anchor and the sticky playground
 * occupies the right column.
 */
function OpenApiLayout(props: {
  children: React.ReactNode
  outline?: boolean | undefined
  width?: 'default' | 'full'
}) {
  return (
    <MdxPageContext.Provider
      frontmatter={{ outline: props.outline ?? true, content: { width: props.width ?? 'full' } }}
    >
      <Layout>{props.children}</Layout>
    </MdxPageContext.Provider>
  )
}

/**
 * Renders a consumer-authored "guide" page (a normal MDX page mounted under an
 * OpenAPI section path, e.g. `pages/api/auth.mdx`).
 *
 * Uses the same full-bleed layout as the section landing page (the left
 * centering gutter collapses to the sidebar, so content sits flush after it).
 * Like the landing page it is single-column, so it keeps the normal right
 * gutter/TOC outline (the default). The authored prose is wrapped in
 * `[data-v-openapi-guide]`, which caps it to the readable content width and
 * reapplies markdown block rhythm/heading treatment, so the guide keeps a
 * regular page's article width and padding while matching the gutter layout of
 * the rest of the section.
 *
 * For authored guide pages the frontmatter `title`/`description` are
 * intentionally not rendered as an on-page header; the authored MDX owns its own
 * headings (like a normal page). Trait pages (`x-traitTag`) opt in via `header`,
 * since their title/subtitle come from the spec tag and the body has no heading.
 */
export function OpenApiGuide(props: OpenApiGuide.Props) {
  return (
    <OpenApiLayout width="full">
      {props.title ? <title>{props.title}</title> : null}
      <div data-v-openapi-guide>
        {props.header && props.title ? (
          <header data-v-openapi-header>
            <h1 data-v data-v-openapi-h1 id={props.id}>
              {props.title}
              {props.id ? <HeadingAnchor id={props.id} /> : null}
            </h1>
            {props.description ? <Prose markdown={props.description} attr="description" /> : null}
          </header>
        ) : null}
        {props.children}
      </div>
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
    /**
     * Render `title`/`description` as an on-page header above the content (used
     * by trait pages, whose Markdown body has no heading of its own).
     */
    header?: boolean | undefined
    /** Anchor id for the rendered header heading (enables a copy-link anchor). */
    id?: string | undefined
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
      <OpenApiLayout outline={false}>
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
