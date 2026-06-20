/**
 * OpenAPI integration config.
 *
 * Mounts an isolated, auto-generated API reference section in the docs from an
 * OpenAPI spec. Use {@link from} to define an entry in `vocs.config.ts`.
 */

/**
 * Spec source.
 *
 * - A file path relative to the project root (e.g. `./openapi.yaml`).
 * - A URL (e.g. `https://example.com/openapi.json`).
 * - Raw JSON/YAML content.
 * - An inline OpenAPI document object.
 */
export type Spec = string | Record<string, unknown>

export type Config = {
  /**
   * OpenAPI spec source: file path, URL, raw content, or inline object.
   */
  spec: Spec
  /**
   * Mount path for the generated API reference section.
   *
   * The section gets its own isolated sidebar scoped to this path.
   *
   * @example "/api"
   */
  path: string
}

/**
 * Defines an OpenAPI integration entry.
 *
 * @example
 * ```ts
 * import { OpenApi } from 'vocs/config'
 *
 * export default defineConfig({
 *   openapi: [
 *     OpenApi.from({ spec: './openapi.yaml', path: '/api' }),
 *   ],
 * })
 * ```
 */
export function from(config: from.Options): Config {
  const { spec, path } = config

  if (!spec) throw new Error('[vocs] `openapi` entry is missing a `spec`.')
  if (!path) throw new Error('[vocs] `openapi` entry is missing a `path`.')

  // Normalize mount path: ensure leading slash, strip trailing slash.
  let normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (normalizedPath.length > 1 && normalizedPath.endsWith('/'))
    normalizedPath = normalizedPath.slice(0, -1)

  return {
    spec,
    path: normalizedPath,
  }
}

export declare namespace from {
  type Options = Config
}
