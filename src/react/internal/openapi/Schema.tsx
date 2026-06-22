import { Fragment } from 'react'
import * as Markdown from '../../../internal/markdown.js'
import { type SchemaPath, schemaPropertyId } from '../../../internal/openapi/anchors.js'
import {
  unionVariantSchemas,
  unionVariantSegment,
  unwrapSingleVariant,
} from '../../../internal/openapi/union.js'
import { Badge } from '../../Badge.js'
import { CollapsibleChildren } from './CollapsibleChildren.client.js'
import { EnumValues } from './EnumValues.client.js'
import { HeadingAnchor } from './HeadingAnchor.js'
import { PropertyExample } from './PropertyExample.client.js'
import { SchemaUnion } from './SchemaUnion.client.js'

type SchemaObject = Record<string, unknown>

const maxDepth = 6

/**
 * Renders a human-readable type label for a JSON Schema (post-dereference).
 */
export function typeLabel(schema: SchemaObject | undefined): string {
  if (!schema) return 'unknown'

  if (Array.isArray(schema['type'])) return (schema['type'] as string[]).join(' | ')

  const composite = (schema['oneOf'] ?? schema['anyOf']) as SchemaObject[] | undefined
  if (composite) return composite.map(typeLabel).join(' | ')

  if (Array.isArray(schema['allOf']))
    return (schema['allOf'] as SchemaObject[]).map(typeLabel).join(' & ')

  if (schema['type'] === 'array') return `${typeLabel(schema['items'] as SchemaObject)}[]`

  if (typeof schema['type'] === 'string') {
    const format = schema['format'] ? ` <${schema['format']}>` : ''
    return `${schema['type']}${format}`
  }

  // Enum without an explicit `type`: the literal values are rendered separately
  // as a values list (see {@link enumValues}), so just label it `enum`.
  if (Array.isArray(schema['enum'])) return 'enum'

  if (schema['properties']) return 'object'

  return 'unknown'
}

/**
 * Detects a `oneOf`/`anyOf` union (unwrapping array item schemas) worth showing
 * as a {@link SchemaUnion} variant picker, returning its variants. Trivial
 * `null` members are dropped, and plain scalar unions with no extra info (e.g.
 * `string | number`) keep their inline type label instead — the picker is only
 * used when at least one variant carries something to show (object properties,
 * an enum, a `const`, a format, or a title).
 */
export function unionVariants(schema: SchemaObject | undefined): unionVariants.Result | undefined {
  const variants = unionVariantSchemas(schema)
  if (!variants) return undefined
  const target =
    schema?.['type'] === 'array' && schema['items'] ? (schema['items'] as SchemaObject) : schema
  const oneOf = target?.['oneOf']
  return {
    kind: oneOf ? 'One of' : 'Any of',
    variants: variants.map((member, index) => ({
      name: variantName(member, index),
      schema: member,
    })),
  }
}

/** A human-readable label for a single union variant. */
function variantName(member: SchemaObject, index: number): string {
  if (typeof member['title'] === 'string' && member['title']) return member['title']
  if ('const' in member) return stringify(member['const'])
  const values = enumValues(member)
  if (values && values.length > 0) {
    const joined = values.join(' | ')
    if (joined.length <= 32) return joined
    return 'enum'
  }
  return typeLabel(member) || `Option ${index + 1}`
}

export declare namespace unionVariants {
  type Result = {
    kind: string
    variants: { name: string; schema: SchemaObject }[]
  }
}

/**
 * Extracts a schema's enum literals as display strings (strings unquoted, other
 * values JSON-stringified), unwrapping array item schemas. These are rendered
 * as a separate "values" list rather than a wrapping inline union, matching the
 * Scalar/Stripe reference UI.
 */
export function enumValues(schema: SchemaObject | undefined): string[] | undefined {
  if (!schema) return undefined
  const target =
    schema['type'] === 'array' && schema['items'] ? (schema['items'] as SchemaObject) : schema
  const values = target['enum']
  if (!Array.isArray(values) || values.length === 0) return undefined
  return values.map((value) => (typeof value === 'string' ? value : JSON.stringify(value)))
}

/**
 * Builds the constraint metadata shown beneath a property/parameter type as
 * `{ label, value }` pairs (e.g. `min 0`, `max 100`, `default 10`), in the
 * style of Scalar/Stripe references. The type itself is rendered separately
 * (see {@link typeLabel}).
 */
export function schemaMeta(schema: SchemaObject | undefined): schemaMeta.Entry[] {
  if (!schema) return []
  const parts: schemaMeta.Entry[] = []

  const num = (key: string) =>
    typeof schema[key] === 'number' ? (schema[key] as number) : undefined
  const min = num('minimum') ?? num('minLength') ?? num('minItems')
  const max = num('maximum') ?? num('maxLength') ?? num('maxItems')
  if (min !== undefined) parts.push({ label: 'min', value: String(min) })
  if (max !== undefined) parts.push({ label: 'max', value: String(max) })

  if ('const' in schema) parts.push({ label: 'const', value: stringify(schema['const']) })
  if ('default' in schema) parts.push({ label: 'default', value: stringify(schema['default']) })

  return parts
}

export declare namespace schemaMeta {
  type Entry = { label: string; value: string }
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

/**
 * Extracts a representative example value from a schema (`example` or the first
 * entry of `examples`), returned as a display string.
 */
export function schemaExample(schema: SchemaObject | undefined): string | undefined {
  if (!schema) return undefined
  if ('example' in schema) return stringify(schema['example'])
  const examples = schema['examples']
  if (Array.isArray(examples) && examples.length > 0) return stringify(examples[0])
  return undefined
}

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
 * object/array properties are indented beneath their parent.
 */
export function Schema(props: Schema.Props) {
  const { schema: rawSchema, depth = 0, prefix = '', idBase, path = [] } = props
  if (!rawSchema || depth > maxDepth) return null

  // Unwrap a nullable/optional single-variant union (e.g. `oneOf: [null, X]`) to
  // its sole member so X's type and properties render instead of nothing.
  const schema = unwrapSingleVariant(rawSchema) ?? rawSchema

  // Render oneOf/anyOf unions as a variant picker rather than a type string.
  const union = unionVariants(schema)
  if (union)
    return <UnionView union={union} depth={depth} prefix={prefix} idBase={idBase} path={path} />

  // Unwrap arrays to show the item schema's properties (path is unchanged: array
  // items share the array property's anchor path).
  if (schema['type'] === 'array' && schema['items'])
    return (
      <Schema
        schema={schema['items'] as SchemaObject}
        depth={depth}
        prefix={prefix}
        idBase={idBase}
        path={path}
      />
    )

  // Merge allOf members for display.
  const allOf = schema['allOf'] as SchemaObject[] | undefined
  const properties = (schema['properties'] ??
    allOf?.reduce<Record<string, SchemaObject>>((acc, member) => {
      Object.assign(acc, (member['properties'] as Record<string, SchemaObject>) ?? {})
      return acc
    }, {})) as Record<string, SchemaObject> | undefined

  if (!properties || Object.keys(properties).length === 0) return null

  const required = new Set((schema['required'] as string[] | undefined) ?? [])

  return (
    <div data-v-openapi-schema>
      {Object.entries(properties).map(([name, rawProperty]) => {
        // Unwrap a nullable single-variant union so the member's type label and
        // nested properties surface (e.g. an optional object's children).
        const property = unwrapSingleVariant(rawProperty) ?? rawProperty
        const childPrefix = `${prefix}${name}${property['type'] === 'array' ? '[]' : ''}.`
        const childPath = [...path, name]
        const id = idBase ? schemaPropertyId(idBase, childPath) : undefined
        const propertyUnion = unionVariants(property)
        return (
          <PropertyRow
            key={name}
            id={id}
            name={name}
            prefix={prefix || undefined}
            type={propertyUnion ? undefined : typeLabel(property)}
            values={propertyUnion ? undefined : enumValues(property)}
            meta={propertyUnion ? [] : schemaMeta(property)}
            example={propertyUnion ? undefined : schemaExample(property)}
            required={required.has(name)}
            deprecated={property['deprecated'] === true}
            description={
              typeof property['description'] === 'string'
                ? (property['description'] as string)
                : undefined
            }
          >
            {propertyUnion
              ? depth < maxDepth && (
                  <UnionView
                    union={propertyUnion}
                    depth={depth + 1}
                    prefix={childPrefix}
                    idBase={idBase}
                    path={childPath}
                  />
                )
              : depth < maxDepth &&
                hasChildren(property) && (
                  <CollapsibleChildren>
                    <div data-v-openapi-children>
                      <Schema
                        schema={property}
                        depth={depth + 1}
                        prefix={childPrefix}
                        idBase={idBase}
                        path={childPath}
                      />
                    </div>
                  </CollapsibleChildren>
                )}
          </PropertyRow>
        )
      })}
    </div>
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
}) {
  const { union, depth, prefix, idBase, path = [] } = props
  return (
    <SchemaUnion
      kind={union.kind}
      names={union.variants.map((variant) => variant.name)}
      panels={union.variants.map((variant, index) => (
        <VariantPanel
          key={variant.name}
          schema={variant.schema}
          depth={depth}
          prefix={prefix}
          idBase={idBase}
          path={[...path, unionVariantSegment(index)]}
        />
      ))}
    />
  )
}

/**
 * Renders the body of a single union variant: its description, plus either the
 * nested object schema (for object-like variants) or an inline type/meta line
 * and enum values (for scalar variants).
 */
function VariantPanel(props: {
  schema: SchemaObject
  depth: number
  prefix: string
  idBase?: string | undefined
  path?: SchemaPath | undefined
}) {
  const { schema, depth, prefix, idBase, path = [] } = props
  const description = schema['description']
  const items = (schema['type'] === 'array' ? schema['items'] : undefined) as
    | SchemaObject
    | undefined
  const objectish = Boolean(
    schema['properties'] || schema['allOf'] || items?.['properties'] || items?.['allOf'],
  )
  const meta = schemaMeta(schema)
  const values = enumValues(schema)
  return (
    <div data-v-openapi-variant>
      {!objectish && (
        <div data-v-openapi-property-meta>
          <code data-v data-v-openapi-type>
            {typeLabel(schema)}
          </code>
          {meta.map((item) => (
            <Fragment key={item.label}>
              <span data-v-openapi-meta-sep>·</span>
              <span>
                <span data-v-openapi-meta-label>{item.label} </span>
                <span data-v-openapi-meta-value>{item.value}</span>
              </span>
            </Fragment>
          ))}
        </div>
      )}
      {typeof description === 'string' && (
        <div
          data-v-openapi-property-description
          data-v-content
          // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered trusted spec content
          dangerouslySetInnerHTML={{ __html: Markdown.toHtml(description) }}
        />
      )}
      {!objectish && values && values.length > 0 && <EnumValues values={values} />}
      {objectish && (
        <Schema schema={schema} depth={depth} prefix={prefix} idBase={idBase} path={path} />
      )}
    </div>
  )
}

/** Whether a schema exposes nested properties worth rendering as child rows. */
function hasChildren(schema: SchemaObject): boolean {
  if (schema['properties']) return true
  if (schema['allOf']) return true
  if (schema['type'] === 'array' && schema['items'])
    return hasChildren(schema['items'] as SchemaObject)
  return false
}
