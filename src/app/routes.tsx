import { type RouteObject } from 'react-router-dom'
import { routes as routes_virtual } from 'virtual:routes'

import { PageLayout } from './components/PageLayout.js'
import { components } from './components/mdx/index.js'
import { Root } from './root.js'

export const routes = routes_virtual.map((route_virtual) => ({
  path: route_virtual.path,
  lazy: async () => {
    const { frontmatter, head, ...route } = await route_virtual.lazy()

    return {
      ...route,
      element: (
        <Root frontmatter={frontmatter} head={head} path={route_virtual.path}>
          <PageLayout>
            <route.default components={components} />
          </PageLayout>
        </Root>
      ),
    } satisfies RouteObject
  },
})) satisfies RouteObject[]
