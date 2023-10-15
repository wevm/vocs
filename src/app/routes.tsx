import type { RouteObject } from 'react-router-dom'
import { pages } from 'virtual:pages'

export const routes: RouteObject[] = pages.map((page) => ({
  path: page.path,
  lazy: async () => {
    const route = await page.lazy()
    return {
      ...route,
      Component: route.default,
    }
  },
}))
