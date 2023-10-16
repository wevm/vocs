import type { MDXComponents } from 'mdx/types.js'
import { Helmet } from 'react-helmet'
import type { RouteObject } from 'react-router-dom'
import { pages } from 'virtual:pages'

import { FrontmatterHead } from './components/FrontmatterHead.js'

const components: MDXComponents = {}

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
          <div className="vocs" style={{ maxWidth: '768px', margin: 'auto', padding: '60px 0' }}>
            <route.default components={components} />
          </div>
        </>
      ),
    } satisfies RouteObject
  },
}))
