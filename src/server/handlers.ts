/// <reference types="vite/client" />
import * as Config from '../internal/config.js'

export { compose, openApi } from './openapi/handler.js'

/**
 * Loads the Vite-only OG assets (takumi wasm + font) via a Vite
 * `import.meta.glob` trampoline.
 *
 * Vite implements `import.meta.glob` and rewrites it into a dynamic import of
 * `./og-assets`, processing its `?url`/`?arraybuffer` asset imports normally.
 * Bundlers that don't implement the macro (esbuild/Wrangler) leave the call
 * untouched and never follow `./og-assets`, so importing the `vocs/server`
 * barrel for `Handler.openApi` stays edge-safe. The glob is only evaluated when
 * `og().fetch` actually runs, so the indirection costs non-Vite consumers
 * nothing unless they call `Handler.og`.
 */
async function loadOgAssets(): Promise<typeof import('./og-assets.js')> {
  const modules = import.meta.glob('./og-assets.{js,ts}')
  const load = modules['./og-assets.js'] ?? modules['./og-assets.ts']
  if (!load)
    throw new Error(
      '[vocs] `Handler.og` requires the Vocs/Vite build pipeline (the OG image assets are Vite transforms).',
    )
  return (await load()) as typeof import('./og-assets.js')
}

type Handler = {
  fetch: (request: Request) => Promise<Response>
}

/**
 * Creates an OG image handler using Takumi's ImageResponse.
 *
 * Automatically resolves config, parses query parameters (`title`, `description`),
 * and renders the provided JSX element as a 1200x630 image.
 *
 * @example
 * ```tsx
 * // src/pages/_api/api/og.tsx
 * import { Handler } from 'vocs/server'
 *
 * export default function handler(request: Request) {
 *   return Handler.og(({ title, description, logo }) => (
 *     <div style={{ display: 'flex', width: '100%', height: '100%' }}>
 *       <h1>{title}</h1>
 *       <p>{description}</p>
 *       {logo && <img src={logo} />}
 *     </div>
 *   )).fetch(request)
 * }
 * ```
 */
export function og(render: (props: og.Props) => React.JSX.Element): Handler {
  return {
    fetch: async (request) => {
      // Loaded lazily via a Vite glob trampoline (see `loadOgAssets`) so plain
      // Node/edge consumers of `vocs/server` — e.g. `Handler.openApi` — can
      // import the namespace without their bundler following the Vite-only
      // takumi/font asset imports.
      const { ImageResponse, wasm, font } = await loadOgAssets()

      const url = new URL(request.url)
      const config = await Config.resolve({ server: true })

      const title = url.searchParams.get('title') || config.title
      const description = url.searchParams.get('description') || config.description

      const configLogo = typeof config.logoUrl === 'string' ? config.logoUrl : config.logoUrl?.dark
      const logo = configLogo && config.baseUrl ? `${config.baseUrl}${configLogo}` : undefined

      const element = render({ config, title, description, logo })

      const wasmUrl = new URL(wasm, url.origin)
      const module = await fetch(wasmUrl).then((r) => r.arrayBuffer())

      try {
        return new ImageResponse(element, {
          fonts: [{ name: 'Inter', data: font }],
          module,
          width: 1200,
          height: 630,
        })
      } catch (error) {
        console.error(error)
        return new Response('Failed to generate OG image', { status: 500 })
      }
    },
  }
}

export declare namespace og {
  /** Props passed to the render function. */
  type Props = {
    /** Resolved Vocs configuration. */
    config: Config.Config
    /** Page description from query param or config. */
    description?: string | undefined
    /** Resolved logo URL (dark variant preferred). */
    logo?: string | undefined
    /** Page title from query param or config. */
    title: string
  }
}
