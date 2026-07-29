import { Fragment } from 'react'
import * as Markdown from '../../../internal/markdown.js'
import type { SchemaPath } from '../../../internal/openapi/anchors.js'
import {
  type schemaMeta,
  toSchemaModel,
  toUnionModel,
  type unionVariants,
} from '../../../internal/openapi/schema-model.js'
import { Badge } from '../../Badge.js'
import { EnumValues } from './EnumValues.client.js'
import { HeadingAnchor } from './HeadingAnchor.js'
import { PropertyExample } from './PropertyExample.client.js'
import { SchemaView } from './Schema.client.js'

/**
 * A single parameter/property row: name + inline metadata, an optional
 * markdown description, and optional nested content (child schema). Rows are
 * separated by a top border rather than wrapped in individual cards.
 */
export function PropertyRow(props: PropertyRow.Props) {
  const {
    id,
    name,
    prefix,
    type,
    values,
    meta,
    example,
    required,
    deprecated,
    description,
    children,
  } = props
  const inline: { key: string; node: React.ReactNode }[] = [
    ...(type
      ? [
          {
            key: 'type',
            node: (
              <code data-v data-v-openapi-type>
                {type}
              </code>
            ),
          },
        ]
      : []),
    ...meta.map((item) => ({
      key: item.label,
      node: (
        <span>
          <span data-v-openapi-meta-label>{item.label} </span>
          <span data-v-openapi-meta-value>{item.value}</span>
        </span>
      ),
    })),
  ]
  return (
    <div data-v-openapi-property id={id}>
      <div data-v-openapi-property-head>
        <span data-v-openapi-property-name>
          {prefix && <span data-v-openapi-property-prefix>{prefix}</span>}
          <span data-v-openapi-property-label>{name}</span>
        </span>
        {required && (
          <Badge variant="warning" data-v-openapi-property-required>
            Required
          </Badge>
        )}
        {deprecated && <Badge variant="note">Deprecated</Badge>}
        {id && <HeadingAnchor id={id} />}
      </div>
      {inline.length > 0 && (
        <div data-v-openapi-property-meta>
          {inline.map((item, index) => (
            <Fragment key={item.key}>
              {index > 0 && <span data-v-openapi-meta-sep>·</span>}
              {item.node}
            </Fragment>
          ))}
        </div>
      )}
      {description && (
        <div
          data-v-openapi-property-description
          data-v-content
          // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered trusted spec content
          dangerouslySetInnerHTML={{ __html: Markdown.toHtml(description) }}
        />
      )}
      {values && values.length > 0 && <EnumValues values={values} />}
      {example !== undefined && <PropertyExample id={id} value={example} />}
      {children}
    </div>
  )
}

export declare namespace PropertyRow {
  type Props = {
    /** Anchor id; when set, renders a copy-link heading anchor beside the name. */
    id?: string | undefined
    name: string
    /** Muted ancestor path shown before the name (e.g. `error.details[].`). */
    prefix?: string | undefined
    /** Human-readable type label rendered as an inline code block. */
    type?: string | undefined
    /** Enum literals rendered as a vertical "values" list below the type. */
    values?: string[] | undefined
    /** Constraint metadata (min/max/const/default) rendered below the type. */
    meta: schemaMeta.Entry[]
    /** Example value rendered below the description. */
    example?: string | undefined
    required?: boolean | undefined
    deprecated?: boolean | undefined
    description?: string | undefined
    children?: React.ReactNode
  }
}

/**
 * Recursively renders a schema's properties as a list of rows. Nested
 * object/array properties are projected into a compact display model and
 * materialized by the client only after their disclosure is opened.
 */
export function Schema(props: Schema.Props) {
  const { depth = 0, prefix = '', idBase, modelId, modelSource, path = [] } = props
  const model = toSchemaModel(props.schema, depth)
  if (!model) return null
  return (
    <SchemaView
      {...(modelId && modelSource ? { modelId, modelSource } : { model })}
      prefix={prefix}
      idBase={idBase}
      path={path}
    />
  )
}

export declare namespace Schema {
  type Props = {
    schema: Record<string, unknown> | undefined
    depth?: number | undefined
    /** Muted ancestor path prepended to each child row's name. */
    prefix?: string | undefined
    /**
     * When set, each property row gets an element id of
     * `schemaPropertyId(idBase, path)` so response example lines can link to it.
     */
    idBase?: string | undefined
    /** Schema path (chain of property names) leading to this schema. */
    path?: SchemaPath | undefined
    /** Key in the category's code-split schema-model document. */
    modelId?: string | undefined
    /** Category schema-model document key. */
    modelSource?: string | undefined
  }
}

/**
 * Renders a union's variant picker: each panel shows the variant's description
 * followed by its schema. Panels are server-rendered; the client picker mounts
 * only the selected one.
 */
export function UnionView(props: {
  union: unionVariants.Result
  depth: number
  prefix: string
  idBase?: string | undefined
  path?: SchemaPath | undefined
  modelId?: string | undefined
  modelSource?: string | undefined
}) {
  const { union, depth, prefix, idBase, modelId, modelSource, path = [] } = props
  const model = toUnionModel(union, depth)
  return (
    <SchemaView
      {...(modelId && modelSource ? { modelId, modelSource } : { model })}
      prefix={prefix}
      idBase={idBase}
      path={path}
    />
  )
}
