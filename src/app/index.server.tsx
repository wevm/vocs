import './styles/index.css.js'

import type { Request } from '@tinyhttp/app'
import { renderToString } from 'react-dom/server'
import { Helmet } from 'react-helmet'
import { Route, Routes } from 'react-router-dom'
import {
  type StaticHandlerContext,
  StaticRouter,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from 'react-router-dom/server.js'

import { routes } from './routes.js'
import { createFetchRequest } from './utils/createFetchRequest.js'

export async function prerender(location: string) {
  const unwrappedRoutes = await Promise.all(
    routes.map(async (route) => {
      const lazyRoute = await route.lazy()
      return {
        path: route.path,
        element: lazyRoute.element,
      }
    }),
  )

  const body = renderToString(
    <StaticRouter location={location}>
      <Routes>
        {unwrappedRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </StaticRouter>,
  )

  return { head: head(), body }
}

export async function render(req: Request) {
  const { query, dataRoutes } = createStaticHandler(routes)
  const fetchRequest = createFetchRequest(req)
  const context = (await query(fetchRequest)) as StaticHandlerContext

  if (context instanceof Response) throw context

  const router = createStaticRouter(dataRoutes, context)

  const body = renderToString(<StaticRouterProvider router={router} context={context} />)

  return { head: head(), body }
}

function head() {
  const helmet = Helmet.renderStatic()

  return `
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    ${helmet.style.toString()}
    ${helmet.script.toString()}
  `
}
