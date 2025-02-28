import './styles/index.css.js'

import { Route, type RouteObject, Routes } from 'react-router'
import {
  type StaticHandlerContext,
  StaticRouter,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from 'react-router'

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

  return (
    <ConfigProvider config={config}>
      <StaticRouter location={location} basename={basePath}>
        <Routes>
          {unwrappedRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </StaticRouter>
    </ConfigProvider>
  )
}

export async function render(req: Request) {
  const { config } = await resolveVocsConfig()
  const { basePath } = config

  const { query, dataRoutes } = createStaticHandler(routes, { basename: basePath })
  const fetchRequest = createFetchRequest(req)
  const context = (await query(fetchRequest)) as StaticHandlerContext

  if (context instanceof Response) throw context

  const router = createStaticRouter(dataRoutes, context)

  return (
    <ConfigProvider config={config}>
      <StaticRouterProvider router={router} context={context} />
    </ConfigProvider>
  )
}
