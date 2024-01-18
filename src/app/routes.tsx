import { type RouteObject } from 'react-router-dom'
import { routes as routes_virtual } from 'virtual:routes'

import { NotFound } from './components/NotFound.js'
import { DocsLayout } from './layouts/DocsLayout.js'
import { Root } from './root.js'

const notFoundRoute = (() => {
  const virtualRoute = routes_virtual.find(({ path }) => path === '*')
  if (virtualRoute)
    return {
      path: virtualRoute.path,
      lazy: async () => {
        const { frontmatter, ...route } = await virtualRoute.lazy()

        return {
          ...route,
          element: (
            <Root frontmatter={frontmatter} path={virtualRoute.path}>
              <DocsLayout>
                <route.default />
              </DocsLayout>
            </Root>
          ),
        } satisfies RouteObject
      },
    }

  return {
    path: '*', // 404
    lazy: undefined,
    element: (
      <Root frontmatter={{ layout: 'minimal' }} path="*">
        <DocsLayout>
          <NotFound />
        </DocsLayout>
      </Root>
    ),
  }
})()

export const routes = [
  ...routes_virtual
    .filter(({ path }) => path !== '*')
    .map((route_virtual) => ({
      path: route_virtual.path,
      lazy: async () => {
        const { frontmatter, ...route } = await route_virtual.lazy()

        return {
          ...route,
          element: (
            <Root
              filePath={route_virtual.filePath}
              frontmatter={frontmatter}
              lastUpdatedAt={route_virtual.lastUpdatedAt}
              path={route_virtual.path}
            >
              <DocsLayout>
                <route.default />
              </DocsLayout>
            </Root>
          ),
        } satisfies RouteObject
      },
    })),
  notFoundRoute,
] satisfies RouteObject[]
