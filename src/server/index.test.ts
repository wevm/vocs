import { expect, test, vi } from 'vitest'

// Importing the runtime barrel must not evaluate Node-only Markdown tooling.
vi.mock('../internal/llms.js', () => {
  throw new Error('Loaded Markdown generation')
})
vi.mock('../internal/markdown-output.js', () => {
  throw new Error('Loaded Markdown auditing')
})

test('keeps build-only Markdown helpers out of the runtime barrel', async () => {
  const server = await import('./index.js')
  expect(server.Handler.openApi).toBeTypeOf('function')
  // Workers-safe modules for Hono apps share the runtime barrel.
  expect(server.Negotiation.middleware).toBeTypeOf('function')
  expect(server.Llms.index).toBeTypeOf('function')
  expect(server.MarkdownRender.render).toBeTypeOf('function')
  expect(server.Sitemap.urlset).toBeTypeOf('function')
  expect(server.Feed.rss).toBeTypeOf('function')
  expect(server.SearchFusion.fuse).toBeTypeOf('function')
  expect(server).not.toHaveProperty('MarkdownExports')
  expect(server).not.toHaveProperty('MarkdownOutput')
})
