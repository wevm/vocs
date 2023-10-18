import type { MDXComponents } from 'mdx/types.js'
import { Helmet } from 'react-helmet'
import { type RouteObject } from 'react-router-dom'
import { pages } from 'virtual:pages'

import { A } from './components/A.js'
import { FrontmatterHead } from './components/FrontmatterHead.js'

const components: MDXComponents = {
  a: A,
}

export const routes = pages.map((page) => ({
  path: page.path,
  lazy: async () => {
    const { frontmatter, head, ...route } = await page.lazy()
    return {
      ...route,
      element: (
        <>
          {head && <Helmet>{head}</Helmet>}
          {frontmatter && <FrontmatterHead frontmatter={frontmatter} />}
          <div className="vocs">
            <div className="content">
              <route.default components={components} />
            </div>
          </div>
        </>
      ),
    } satisfies RouteObject
  },
}))
