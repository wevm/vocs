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
  expect(server).not.toHaveProperty('MarkdownExports')
  expect(server).not.toHaveProperty('MarkdownOutput')
})
