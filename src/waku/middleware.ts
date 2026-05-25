import * as middleware from './internal/middleware/index.js'

export function middlewareModules(overrides: Record<string, () => Promise<unknown>> = {}) {
  const internal = Object.fromEntries(
    Object.entries(middleware).map(([key, value]) => [
      key,
      () => Promise.resolve({ default: value }),
    ]),
  )
  return { ...internal, ...overrides }
}
