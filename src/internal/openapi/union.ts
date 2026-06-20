/**
 * Shared `oneOf`/`anyOf` union detection so the schema documentation rows (which
 * render a variant picker) and the response example sampler (which samples one
 * variant) agree on which variants exist and in what order. Keeping this
 * framework-agnostic lets both the React renderer and the sample serializer
 * derive identical variant-qualified anchor ids.
 */

type SchemaObject = Record<string, unknown>

/**
 * The displayable variant schemas of a union rendered as a variant picker, or
 * `undefined` when the schema is not shown as a picker (no `oneOf`/`anyOf`,
 * fewer than two non-null members, or a plain scalar union like `string |
 * number` with nothing extra to show). Array schemas are unwrapped to their item
 * schema first. The returned order is the index space used by
 * {@link unionVariantSegment}.
 */
export function unionVariantSchemas(schema: SchemaObject | undefined): SchemaObject[] | undefined {
  if (!schema) return undefined
  const target =
    schema['type'] === 'array' && schema['items'] ? (schema['items'] as SchemaObject) : schema
  const oneOf = target['oneOf'] as SchemaObject[] | undefined
  const members = (oneOf ?? target['anyOf']) as SchemaObject[] | undefined
  if (!Array.isArray(members)) return undefined
  const variants = members.filter(
    (member) => member && typeof member === 'object' && member['type'] !== 'null',
  )
  if (variants.length < 2) return undefined
  const rich = variants.some(
    (member) =>
      member['properties'] ||
      member['allOf'] ||
      typeof member['title'] === 'string' ||
      Array.isArray(member['enum']) ||
      'const' in member ||
      typeof member['format'] === 'string',
  )
  if (!rich) return undefined
  return variants
}

/** The path segment qualifying a union variant by its index (see {@link unionVariantSchemas}). */
export function unionVariantSegment(index: number): string {
  return `variant-${index}`
}
