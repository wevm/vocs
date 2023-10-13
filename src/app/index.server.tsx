import * as ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.js'
import { Helmet } from 'react-helmet'

import { App } from './main.js'
import { pages } from './pages.js'

export function render(url: string) {
  const page = pages().find((route) => route.path === url)
  if (!page) throw new Error(`No page found for ${url}`)

  const body = ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )
  const helmet = Helmet.renderStatic()
  const head = `
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    ${helmet.style.toString()}
    ${helmet.script.toString()}
  `

  return { head, body }
}
