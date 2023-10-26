import { type RouteObject } from 'react-router-dom'
import { routes as routes_virtual } from 'virtual:routes'

import { Content } from './components/Content.js'
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
          <Content>
            <route.default components={components} />
          </Content>
        </Root>
      ),
    } satisfies RouteObject
  },
})) satisfies RouteObject[]
