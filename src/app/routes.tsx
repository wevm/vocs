import type { RouteObject } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { pages } from 'virtual:pages'

import { FrontmatterHead } from './components/FrontmatterHead.js'

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
          <route.default />
        </>
      ),
    } satisfies RouteObject
  },
}))
