import { expect, test, vi } from 'vitest'

// A module entry must not evaluate the rest of the barrel.
vi.mock('./handlers.js', () => {
  throw new Error('Loaded Handler')
})
vi.mock('./changelog.js', () => {
  throw new Error('Loaded Actions')
})

test('loads each Workers-safe module without the barrel', async () => {
  expect((await import('./negotiation.js')).middleware).toBeTypeOf('function')
  expect((await import('./llms.js')).index).toBeTypeOf('function')
  expect((await import('./markdown-render.js')).render).toBeTypeOf('function')
  expect((await import('./sitemap.js')).urlset).toBeTypeOf('function')
  expect((await import('./feed.js')).rss).toBeTypeOf('function')
  expect((await import('./search-fusion.js')).fuse).toBeTypeOf('function')
})
