import * as Markdown from '../markdown.js'
import type { IrGroup, IrMediaType, IrOperation, IrParameter } from './parser.js'
import { unionVariantSchemas, unwrapSingleVariant } from './union.js'

type SchemaObject = Record<string, unknown>

const maxDepth = 6

/** Renders a human-readable type label for a JSON Schema (post-dereference). */
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

  if (Array.isArray(schema['enum'])) return 'enum'
  if (schema['properties']) return 'object'
  return 'unknown'
}

/**
 * Detects a `oneOf`/`anyOf` union worth showing as a variant picker.
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

export declare namespace unionVariants {
  type Result = {
    kind: string
    variants: { name: string; schema: SchemaObject }[]
  }
}

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

/** Extracts a schema's enum literals as display strings. */
export function enumValues(schema: SchemaObject | undefined): string[] | undefined {
  if (!schema) return undefined
  const target =
    schema['type'] === 'array' && schema['items'] ? (schema['items'] as SchemaObject) : schema
  const values = target['enum']
  if (!Array.isArray(values) || values.length === 0) return undefined
  return values.map((value) => (typeof value === 'string' ? value : JSON.stringify(value)))
}

/** Builds the constraint metadata shown beneath a property or parameter type. */
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

export function formatExample(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

/** Extracts a representative example value from a schema. */
export function schemaExample(schema: SchemaObject | undefined): string | undefined {
  if (!schema) return undefined
  if ('example' in schema) return formatExample(schema['example'])
  const examples = schema['examples']
  if (Array.isArray(examples) && examples.length > 0) return formatExample(examples[0])
  return undefined
}

export type SchemaModel =
  | {
      view: 'properties'
      properties: SchemaPropertyModel[]
    }
  | {
      view: 'union'
      label: string
      variants: SchemaVariantModel[]
    }

export type SchemaPropertyModel = {
  name: string
  type?: string | undefined
  values?: string[] | undefined
  meta: schemaMeta.Entry[]
  example?: string | undefined
  required?: boolean | undefined
  deprecated?: boolean | undefined
  descriptionHtml?: string | undefined
  child?: SchemaModel | undefined
  array?: boolean | undefined
}

export type SchemaVariantModel = {
  name: string
  type?: string | undefined
  values?: string[] | undefined
  meta: schemaMeta.Entry[]
  descriptionHtml?: string | undefined
  child?: SchemaModel | undefined
}

/** Projects a dereferenced JSON Schema into the compact interactive display model. */
export function toSchemaModel(
  rawSchema: SchemaObject | undefined,
  depth: number,
): SchemaModel | undefined {
  if (!rawSchema || depth > maxDepth) return undefined

  const schema = unwrapSingleVariant(rawSchema) ?? rawSchema
  const union = unionVariants(schema)
  if (union) return toUnionModel(union, depth)

  if (schema['type'] === 'array' && schema['items'])
    return toSchemaModel(schema['items'] as SchemaObject, depth)

  const allOf = schema['allOf'] as SchemaObject[] | undefined
  const properties = (schema['properties'] ??
    allOf?.reduce<Record<string, SchemaObject>>((acc, member) => {
      Object.assign(acc, (member['properties'] as Record<string, SchemaObject>) ?? {})
      return acc
    }, {})) as Record<string, SchemaObject> | undefined
  if (!properties || Object.keys(properties).length === 0) return undefined

  const required = new Set((schema['required'] as string[] | undefined) ?? [])
  return {
    view: 'properties',
    properties: Object.entries(properties).map(([name, rawProperty]) => {
      const property = unwrapSingleVariant(rawProperty) ?? rawProperty
      const propertyUnion = unionVariants(property)
      return {
        name,
        type: propertyUnion ? undefined : typeLabel(property),
        values: propertyUnion ? undefined : enumValues(property),
        meta: propertyUnion ? [] : schemaMeta(property),
        example: propertyUnion ? undefined : schemaExample(property),
        required: required.has(name),
        deprecated: property['deprecated'] === true,
        descriptionHtml:
          typeof property['description'] === 'string'
            ? Markdown.toHtml(property['description'] as string)
            : undefined,
        child:
          depth >= maxDepth
            ? undefined
            : propertyUnion
              ? toUnionModel(propertyUnion, depth + 1)
              : hasChildren(property)
                ? toSchemaModel(property, depth + 1)
                : undefined,
        array: property['type'] === 'array',
      }
    }),
  }
}

export function toUnionModel(union: unionVariants.Result, depth: number): SchemaModel {
  return {
    view: 'union',
    label: union.kind,
    variants: union.variants.map((variant) => {
      const { schema } = variant
      const items = (schema['type'] === 'array' ? schema['items'] : undefined) as
        | SchemaObject
        | undefined
      const objectish = Boolean(
        schema['properties'] || schema['allOf'] || items?.['properties'] || items?.['allOf'],
      )
      return {
        name: variant.name,
        type: objectish ? undefined : typeLabel(schema),
        values: objectish ? undefined : enumValues(schema),
        meta: objectish ? [] : schemaMeta(schema),
        descriptionHtml:
          typeof schema['description'] === 'string'
            ? Markdown.toHtml(schema['description'] as string)
            : undefined,
        child: objectish ? toSchemaModel(schema, depth) : undefined,
      }
    }),
  }
}

/** Stable key for the code-split schema-model document for one OpenAPI category. */
export function schemaModelSource(mount: string, groupId: string): string {
  return JSON.stringify([mount, groupId])
}

export function parameterSchemaModelId(
  operationId: string,
  parameter: Pick<IrParameter, 'in' | 'name'>,
): string {
  return JSON.stringify(['parameter', operationId, parameter.in, parameter.name])
}

export function requestSchemaModelId(operationId: string, media: Pick<IrMediaType, 'mediaType'>) {
  return JSON.stringify(['request', operationId, media.mediaType])
}

export function responseSchemaModelId(
  operationId: string,
  status: string,
  media: Pick<IrMediaType, 'mediaType'>,
) {
  return JSON.stringify(['response', operationId, status, media.mediaType])
}

/** Builds every schema model referenced by a generated OpenAPI category page. */
export function schemaModels(group: IrGroup): Record<string, SchemaModel> {
  const models: Record<string, SchemaModel> = {}
  const add = (id: string, schema: SchemaObject | undefined, depth: number) => {
    const model = toSchemaModel(schema, depth)
    if (model) models[id] = model
  }

  for (const operation of group.operations) {
    for (const parameter of operation.parameters)
      add(parameterSchemaModelId(operation.id, parameter), parameter.schema, 1)

    for (const media of operation.requestBody?.content ?? [])
      add(requestSchemaModelId(operation.id, media), media.schema, 0)

    addResponseModels(models, operation)
  }
  return models
}

function addResponseModels(models: Record<string, SchemaModel>, operation: IrOperation): void {
  for (const response of operation.responses) {
    for (const media of response.content) {
      const model = toSchemaModel(media.schema, 0)
      if (model) models[responseSchemaModelId(operation.id, response.status, media)] = model
    }
  }
}

function hasChildren(schema: SchemaObject): boolean {
  if (schema['properties']) return true
  if (schema['allOf']) return true
  if (schema['type'] === 'array' && schema['items'])
    return hasChildren(schema['items'] as SchemaObject)
  return false
}
