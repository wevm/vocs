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

/**
 * Returns the sole non-`null` member of a `oneOf`/`anyOf` union when the union
 * has exactly one non-`null` member — the ubiquitous "nullable"/optional
 * pattern, e.g. `oneOf: [{ type: 'null' }, { ...object }]`.
 *
 * Such a union is never shown as a variant picker (see
 * {@link unionVariantSchemas}, which needs ≥2 non-null members), so without
 * unwrapping it renders as a bare `null | object` type label with no expandable
 * children. Callers resolve a schema through this first so the single member's
 * type and nested properties surface instead. The wrapper's `description` wins
 * over the member's so field-level docs are preserved.
 *
 * Returns `undefined` for non-unions or unions with 0 or ≥2 non-null members.
 */
export function unwrapSingleVariant(schema: SchemaObject | undefined): SchemaObject | undefined {
  if (!schema) return undefined
  const members = (schema['oneOf'] ?? schema['anyOf']) as SchemaObject[] | undefined
  if (!Array.isArray(members)) return undefined
  const nonNull = members.filter(
    (member) => member && typeof member === 'object' && member['type'] !== 'null',
  )
  if (nonNull.length !== 1) return undefined
  // biome-ignore lint/style/noNonNullAssertion: length checked above
  const member = nonNull[0]!
  const description = schema['description'] ?? member['description']
  return description === undefined ? member : { ...member, description }
}
