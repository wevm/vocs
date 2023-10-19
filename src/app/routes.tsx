import type { MDXComponents } from 'mdx/types.js'
import { Helmet } from 'react-helmet'
import { type RouteObject } from 'react-router-dom'
import { routes as routes_virtual } from 'virtual:routes'

import { A } from './components/A.js'
import { CodeGroup } from './components/CodeGroup.js'
import { FrontmatterHead } from './components/FrontmatterHead.js'

const components: MDXComponents = {
  a: A,
  div: (props) => {
    if (props.className === 'code-group') return <CodeGroup {...(props as any)} />
    return <div {...props} />
  },
}

export const routes = routes_virtual.map((route_virtual) => ({
  path: route_virtual.path,
  lazy: async () => {
    const { frontmatter, head, ...route } = await route_virtual.lazy()
    return {
      ...route,
      element: (
        <>
          {head && <Helmet>{head}</Helmet>}
          {frontmatter && <FrontmatterHead frontmatter={frontmatter} />}
          <div className="vocs">
            <article>
              <route.default components={components} />
            </article>
          </div>
        </>
      ),
    } satisfies RouteObject
  },
}))
