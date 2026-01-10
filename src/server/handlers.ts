import { ImageResponse } from '@takumi-rs/image-response'
import * as Config from '../internal/config.js'

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
 * // src/pages/api/og.tsx
 * import * as Handler from 'vocs/server/handlers'
 *
 * export default Handler.og(({ title, description, logo }) => (
 *   <div style={{ display: 'flex', width: '100%', height: '100%' }}>
 *     <h1>{title}</h1>
 *     <p>{description}</p>
 *     {logo && <img src={logo} />}
 *   </div>
 * ))
 * ```
 */
export function og(render: (props: og.Props) => React.JSX.Element): Handler {
  return {
    fetch: async (request) => {
      const url = new URL(request.url)
      const config = await Config.resolve({ server: true })

      const title = url.searchParams.get('title') || config.title
      const description = url.searchParams.get('description') || config.description

      const configLogo = typeof config.logoUrl === 'string' ? config.logoUrl : config.logoUrl?.dark
      const logo = configLogo && config.baseUrl ? `${config.baseUrl}${configLogo}` : undefined

      const element = render({ config, title, description, logo })

      return new ImageResponse(element, {
        width: 1200,
        height: 630,
      })
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
