import type { Request } from '@tinyhttp/app'
import * as ReactDOMServer from 'react-dom/server'
import { Helmet } from 'react-helmet'
import {
  type StaticHandlerContext,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from 'react-router-dom/server.js'

import { routes } from './routes.js'
import { createFetchRequest } from './utils.js'

export async function render(req: Request) {
  const { query, dataRoutes } = createStaticHandler(routes)
  const fetchRequest = createFetchRequest(req)
  const context = (await query(fetchRequest)) as StaticHandlerContext

  if (context instanceof Response) throw context

  const router = createStaticRouter(dataRoutes, context)

  const body = ReactDOMServer.renderToString(
    <StaticRouterProvider router={router} context={context} />,
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
