import type { Request } from '@tinyhttp/app'
import { type RouteObject, matchRoutes } from 'react-router-dom'

export function createFetchRequest(req: Request) {
  const origin = `${req.protocol}://${req.headers.host}`
  const url = new URL(req.originalUrl || req.url, origin)

  const controller = new AbortController()
  req.on('close', () => controller.abort())

  const headers = new Headers()

  for (const [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) for (const value of values) headers.append(key, value)
      else headers.set(key, values)
    }
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: controller.signal,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') init.body = req.body

  return new Request(url.href, init)
}

export async function hydrateLazyRoutes(routes: RouteObject[]) {
  // Determine if any of the initial routes are lazy
  const lazyMatches = matchRoutes(routes, window.location)?.filter((m) => m.route.lazy)

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
