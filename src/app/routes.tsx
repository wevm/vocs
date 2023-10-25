import type { MDXComponents } from 'mdx/types.js'
import { type RouteObject } from 'react-router-dom'
import { routes as routes_virtual } from 'virtual:routes'

import { A } from './components/mdx/A.js'
import { Div } from './components/mdx/Div.js'
import { Pre } from './components/mdx/Pre.js'
import { Root } from './root.js'

const components: MDXComponents = {
  a: A,
  div: Div,
  pre: Pre,
}

export const routes = routes_virtual.map((route_virtual) => ({
  path: route_virtual.path,
  lazy: async () => {
    const { frontmatter, head, ...route } = await route_virtual.lazy()
    return {
      ...route,
      element: (
        <Root frontmatter={frontmatter} head={head} path={route_virtual.path}>
          <article>
            <route.default components={components} />
          </article>
        </Root>
      ),
    } satisfies RouteObject
  },
})) satisfies RouteObject[]
