import type { ReactNode } from 'react'
import * as Markdown from '../../../internal/markdown.js'
import type { Ir, IrGroup } from '../../../internal/openapi/parser.js'
import { HeadingAnchor } from './HeadingAnchor.js'
import { Operation } from './Operation.js'

/**
 * Prop-driven OpenAPI renderers shared by the Vite/RSC site integration
 * ({@link file://./OpenApiPage.tsx `OpenApiPage`}) and the standalone client
 * app ({@link file://../../../standalone/openapi/App.client.tsx}).
 *
 * These render only the section content (the `data-v-openapi` tree). They have
 * no dependency on the Waku `Layout`, the `virtual:vocs/openapi` module, or any
 * router — the caller supplies the parsed {@link Ir} and wraps the tree in the
 * appropriate layout/playground provider.
 */

/**
 * Renders trusted markdown from the spec (info/category descriptions) with the
 * same typography as MDX content.
 */
function Prose(props: { markdown: string; attr?: string }) {
  return (
    <div
      data-v-openapi-description={props.attr === 'description' ? '' : undefined}
      data-v-content
      // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered trusted spec content
      dangerouslySetInnerHTML={{ __html: Markdown.toHtml(props.markdown) }}
    />
  )
}

/**
 * Overview / landing page body. Renders the consumer override (or the
 * auto-generated spec header). The domain/endpoint list is opt-in via
 * `<OpenApi.Endpoints />`.
 */
export function ReferenceOverview(props: ReferenceOverview.Props) {
  const { ir, intro, endpoints } = props
  return (
    <div data-v-openapi data-v-openapi-landing>
      {intro ? (
        <div data-v-openapi-intro data-v-content>
          {intro}
        </div>
      ) : (
        <>
          <header data-v-openapi-header>
            <h1 data-v data-v-openapi-info-title>
              {ir.info.title}
            </h1>
            {ir.info.description && <Prose markdown={ir.info.description} attr="description" />}
          </header>
          {endpoints}
        </>
      )}
    </div>
  )
}

export declare namespace ReferenceOverview {
  type Props = {
    ir: Ir
    /** Consumer override rendered in place of the auto-generated header. */
    intro?: ReactNode | undefined
    /**
     * Domain/endpoint list rendered below the auto-generated header (ignored
     * when `intro` is set — overrides control their own content). The caller
     * supplies the framework-specific list; the standalone handler passes it so
     * its Introduction lists every endpoint by default.
     */
    endpoints?: ReactNode | undefined
  }
}

/**
 * Single category page body: category header (or consumer override) followed by
 * its operations. Does not mount the playground provider — the caller wraps this
 * with `PlaygroundProvider` so a single Scalar modal is shared across the page.
 */
export function ReferenceGroup(props: ReferenceGroup.Props) {
  const { ir, group, intro } = props
  return (
    <div data-v-openapi>
      {intro ? (
        // The override keeps the `group.id` anchor so the sidebar "Overview"
        // link and scroll-spy still resolve to this page.
        <div data-v-openapi-intro data-v-content id={group.id}>
          {intro}
        </div>
      ) : (
        <header data-v-openapi-header>
          <h1 data-v data-v-openapi-h1 id={group.id}>
            {group.name}
            <HeadingAnchor id={group.id} />
          </h1>
          {group.description && <Prose markdown={group.description} attr="description" />}
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
  )
}

export declare namespace ReferenceGroup {
  type Props = {
    ir: Ir
    group: IrGroup
    /** Consumer override rendered in place of the auto-generated category header. */
    intro?: ReactNode | undefined
  }
}
