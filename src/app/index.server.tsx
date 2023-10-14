import * as ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.js'
import { Helmet } from 'react-helmet'
import { pages } from 'virtual:pages'

import { Routes } from './routes.js'

export function render(path: string) {
  const page = Object.values(pages).find((route) => route.path === path)
  if (!page) throw new Error(`No page found for ${path}`)

  const body = ReactDOMServer.renderToString(
    <StaticRouter location={path}>
      <Routes />
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
