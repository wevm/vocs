import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.js'
import { App } from './main.js'
import { pages } from './pages.js'

export function render(url: string) {
  const page = pages().find((route) => route.path === url)
  if (!page) throw new Error(`No page found for ${url}`)

  const head = ReactDOMServer.renderToString(page.head())
  const body = ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )

  return { head, body }
}
