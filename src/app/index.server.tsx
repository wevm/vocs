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
import { createFetchRequest } from './utils.js'

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

  const themeKey = 'vocs.theme'
  const themeScript = `<script>(function(){"use strict";function n(){const e=typeof localStorage<"u"?localStorage.getItem("${themeKey}"):null,m=typeof window<"u"?window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark":null;return{storageTheme:e,systemTheme:m}}const o=window.matchMedia("(prefers-color-scheme: dark)"),{storageTheme:t,systemTheme:a}=n(),d=t||a||"dark";document.documentElement.classList.add(d),t||o.addEventListener("change",({matches:e})=>{document.documentElement.classList.add(e?"dark":"light");document.documentElement.classList.replace(e?"light":"dark",e?"dark":"light")})})();</script>`

  return `
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    ${helmet.style.toString()}
    ${helmet.script.toString()}
    ${themeScript}
  `
}
