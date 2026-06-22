import { assets } from './assets.generated.js'

/** A single emitted asset (JS chunk, CSS file, font, …). */
export type AssetFile = {
  /** MIME type, e.g. `text/javascript; charset=utf-8`. */
  type: string
  /** `utf8` for text assets, `base64` for binary (fonts/wasm). */
  encoding: 'utf8' | 'base64'
  /** File contents (string for `utf8`, base64 string for `base64`). */
  body: string
}

/** The prebuilt standalone bundle manifest. */
export type Assets = {
  /** Whether the bundle was built (`false` for the committed stub). */
  built: boolean
  /** Entry JS file name (relative to the asset root), e.g. `client.js`. */
  entry: string
  /** CSS file names to inject into the shell `<head>`. */
  styles: string[]
  /** All emitted files, keyed by name relative to the asset root. */
  files: Record<string, AssetFile>
}

/** URL path segment under which standalone assets are served. */
export const assetRoot = '/_vocs/openapi/'

/** Returns the prebuilt bundle manifest. */
export function manifest(): Assets {
  return assets
}

/**
 * Resolves a request pathname to a bundled asset, matching by the
 * {@link assetRoot} marker so assets resolve regardless of the Hono mount path
 * (e.g. `/docs/_vocs/openapi/client.js` → `client.js`).
 */
export function match(pathname: string): AssetFile | undefined {
  const index = pathname.lastIndexOf(assetRoot)
  if (index === -1) return undefined
  const name = pathname.slice(index + assetRoot.length)
  return assets.files[name]
}

/** Builds a `Response` for a bundled asset with long-lived caching. */
export function response(asset: AssetFile): Response {
  const body =
    asset.encoding === 'base64'
      ? Uint8Array.from(atob(asset.body), (c) => c.charCodeAt(0))
      : asset.body
  return new Response(body, {
    headers: {
      'content-type': asset.type,
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}
