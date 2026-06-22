/**
 * Shared id/path helpers that keep the left-hand schema documentation rows and
 * the right-hand response example lines pointing at the same anchor ids. Both
 * sides derive an element id from a schema "path" (the chain of property names
 * leading to a value, e.g. `['data', 'items', 'id']`) plus an `idBase` that
 * scopes the path to a specific operation section (a request body or a single
 * response status).
 */

/** A chain of property names identifying a value within a schema. */
export type SchemaPath = readonly string[]

/** Slugifies a path segment / title into a URL-safe id fragment. */
export function slug(value: string): string {
  const result = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return result || 'value'
}

/** Id base for an operation's request body schema rows. */
export function requestBodyIdBase(operationId: string): string {
  return `${operationId}-request-body`
}

/** Id base for a single response status's schema rows. */
export function responseIdBase(operationId: string, status: string): string {
  return `${operationId}-response-${slug(status)}`
}

/**
 * Qualifies an id base by media type when a section exposes more than one media
 * type, so colliding paths across media types resolve to distinct ids. With a
 * single media type the base is returned unchanged (shorter, stable ids).
 */
export function mediaIdBase(base: string, mediaType: string, mediaCount: number): string {
  return mediaCount > 1 ? `${base}-${slug(mediaType)}` : base
}

/** The element id for a schema property at `path` within `idBase`. */
export function schemaPropertyId(idBase: string, path: SchemaPath): string {
  return `${idBase}-${slug(path.join('.'))}`
}
