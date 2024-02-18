import './styles/index.css.js'

import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { Helmet } from 'react-helmet'
import { Route, type RouteObject, Routes } from 'react-router-dom'
import {
  type StaticHandlerContext,
  StaticRouter,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from 'react-router-dom/server.js'

import { resolveVocsConfig } from '../vite/utils/resolveVocsConfig.js'
import { ConfigProvider } from './hooks/useConfig.js'
import { routes } from './routes.js'
import { createFetchRequest } from './utils/createFetchRequest.js'

export async function prerender(location: string) {
  const unwrappedRoutes = (
    await Promise.all(
      routes.map(async (route) => {
        const location_ = location === '/' ? '/' : location.replace(/\/$/, '')
        const path = route.path.replace(/\.html$/, '')
        if (path !== location_ && path !== '*') return null
        const element = route.lazy ? (await route.lazy()).element : route.element
        return {
          path: route.path,
          element,
        }
      }),
    )
  ).filter(Boolean) as RouteObject[]

  const { config } = await resolveVocsConfig()
  const { basePath } = config

  const body = renderToString(
    <ConfigProvider config={config}>
      <StaticRouter location={location} basename={basePath}>
        <Routes>
          {unwrappedRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </StaticRouter>
    </ConfigProvider>,
  )

  return { head: await head(), body }
}

export async function render(req: Request) {
  const { config } = await resolveVocsConfig()
  const { basePath } = config

  const { query, dataRoutes } = createStaticHandler(routes, { basename: basePath })
  const fetchRequest = createFetchRequest(req)
  const context = (await query(fetchRequest)) as StaticHandlerContext

  if (context instanceof Response) throw context

  const router = createStaticRouter(dataRoutes, context)

  const body = renderToString(
    <ConfigProvider config={config}>
      <StaticRouterProvider router={router} context={context} />
    </ConfigProvider>,
  )

  return { head: await head(), body }
}

async function head() {
  const { config } = await resolveVocsConfig()
  const { head } = config

  const helmet = Helmet.renderStatic()

  let meta = helmet.meta.toString()
  const match = helmet.meta.toString().match(/property="og:image" content="(.*)"/)
  if (match?.[1]) {
    meta = meta.replace(
      /property="og:image" content="(.*)"/,
      `property="og:image" content="${match[1].replace(/&amp;/g, '&')}"`,
    )
  }

  return `
    ${helmet.title.toString()}
    ${meta}
    ${helmet.link.toString()}
    ${helmet.style.toString()}
    ${helmet.script.toString()}
    ${renderToString(head as ReactElement)}
  `
}
