import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import { Root } from './Root.js'

vi.mock('virtual:vocs/config', () => ({
  config: { colorScheme: 'light dark', accentColor: '#000', head: false },
}))
vi.mock('virtual:vocs/group-icons.css?url', () => ({ default: '' }))
vi.mock('virtual:vocs/user-styles', () => ({ default: '' }))
vi.mock('./Head.js', () => ({ Head: () => null }))
vi.mock('./Root.client.js', () => ({
  Root_client: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('./ScrollRestoration.js', () => ({ ScrollRestoration: () => null }))

test('document defaults do not depend on Waku or generated head metadata', async () => {
  const html = renderToStaticMarkup(await Root({ children: <main>Documentation</main> }))
  expect(html).toContain('<meta charSet="utf-8"/>')
  expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"/>')
  expect(html).toContain('<main>Documentation</main>')
})
