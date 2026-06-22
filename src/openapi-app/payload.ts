import type { Payload } from '../internal/openapi/app.js'

let cached: Payload | undefined

/**
 * Reads (and memoizes) the JSON payload embedded in the prebuilt app's HTML
 * shell. Available synchronously at module-eval time because the shell emits the
 * `#vocs-openapi-data` script before the bundle's module script — so the
 * `virtual:vocs/*` modules can resolve their data on load.
 */
export function read(): Payload {
  if (cached) return cached
  if (typeof document === 'undefined')
    throw new Error('[vocs] OpenAPI payload is only available in the browser.')
  const element = document.getElementById('vocs-openapi-data')
  if (!element?.textContent)
    throw new Error('[vocs] Missing OpenAPI payload (`#vocs-openapi-data`).')
  cached = JSON.parse(element.textContent) as Payload
  return cached
}
