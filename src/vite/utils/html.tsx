import type { ReactNode } from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import type { Config } from '../../config.js'

export async function toMarkup(parameters: {
  body: ReactNode
  config: Config
  head: ReactNode
  location: string
  template: string
}) {
  const { body, config, head, location, template } = parameters
  const { theme } = config

  const configHead = await (async () => {
    if (typeof config.head === 'function') return await config.head({ path: location })
    if (typeof config.head === 'object') {
      const entry = Object.entries(config.head)
        .reverse()
        .find(([key]) => location.startsWith(key))
      return entry?.[1]
    }
    return config.head
  })()
  const templateHead = template.match(/<head>([\s\S]*?)<\/head>/)?.[1]
  const headstr = renderToString(
    <>
      {configHead}
      {head}
    </>,
  )

  let html = renderToStaticMarkup(
    <html lang="en">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: */}
      {templateHead && <head dangerouslySetInnerHTML={{ __html: `${templateHead}${headstr}` }} />}
      <body>{body}</body>
    </html>,
  )
  const match = html.match(/property="og:image" content="(.*)"/)
  if (match?.[1]) {
    html = html.replace(
      /property="og:image" content="(.*)"/,
      `property="og:image" content="${match[1].replace(/&amp;/g, '&')}"`,
    )
  }
  if (theme?.colorScheme && theme?.colorScheme !== 'system')
    html = html.replace('lang="en"', `lang="en" class="${theme.colorScheme}"`)

  return html
}
