import { type RouteObject } from 'react-router-dom'
import { routes as routes_virtual } from 'virtual:routes'

import { components } from './components/mdx/index.js'
import { DocsLayout } from './layouts/DocsLayout.js'
import { Root } from './root.js'

export const routes = routes_virtual.map((route_virtual) => ({
  path: route_virtual.path,
  lazy: async () => {
    const { frontmatter, ...route } = await route_virtual.lazy()

    return {
      ...route,
      element: (
        <Root frontmatter={frontmatter} path={route_virtual.path}>
          <DocsLayout>
            <route.default components={components} />
          </DocsLayout>
        </Root>
      ),
      loader() {
        return { filePath: route_virtual.filePath, frontmatter }
      },
    } satisfies RouteObject
  },
})) satisfies RouteObject[]
