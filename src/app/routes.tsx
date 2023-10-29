import { type RouteObject } from 'react-router-dom'
import { config } from 'virtual:config'
import { routes as routes_virtual } from 'virtual:routes'

import { components } from './components/mdx/index.js'
import { Layout } from './layouts/Layout.js'
import { Root } from './root.js'

export const routes = routes_virtual.map((route_virtual) => ({
  path: route_virtual.path,
  lazy: async () => {
    const { frontmatter, head, ...route } = await route_virtual.lazy()
    const { sidebar } = config

    const defaultLayout = sidebar ? 'with-sidebar' : 'content-only'

    return {
      ...route,
      element: (
        <Root frontmatter={frontmatter} head={head} path={route_virtual.path}>
          <Layout type={frontmatter?.layout || defaultLayout}>
            <route.default components={components} />
          </Layout>
        </Root>
      ),
    } satisfies RouteObject
  },
})) satisfies RouteObject[]
