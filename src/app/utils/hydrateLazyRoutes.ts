import { type RouteObject, matchRoutes } from 'react-router-dom'

export async function hydrateLazyRoutes(routes: RouteObject[], basename?: string) {
  // Determine if any of the initial routes are lazy
  const lazyMatches = matchRoutes(routes, window.location, basename)?.filter((m) => m.route.lazy)

  // Load the lazy matches and update the routes before creating your router
  // so we can hydrate the SSR-rendered content synchronously
  if (lazyMatches && lazyMatches?.length > 0) {
    await Promise.all(
      lazyMatches.map(async (m) => {
        const routeModule = await m.route.lazy!()
        Object.assign(m.route, {
          ...routeModule,
          lazy: undefined,
        })
      }),
    )
  }
}
