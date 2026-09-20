import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import { RouterHostContext_UNSTABLE as RouterHostContext } from 'waku/router/client-core'
import { Link } from './Link.js'

vi.mock('waku', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to} data-router-link="true">
      {children}
    </a>
  ),
}))

test('resolves hash links using the Waku router host', () => {
  const html = renderToStaticMarkup(
    <RouterHostContext
      value={{ route: { path: '/guide', query: '', hash: '' }, navigate: vi.fn() }}
    >
      <Link to="#setup">Setup</Link>
    </RouterHostContext>,
  )
  expect(html).toBe('<a href="/guide#setup" data-router-link="true">Setup</a>')
})

test('renders an anchor outside the router', () => {
  expect(renderToStaticMarkup(<Link to="/guide">Guide</Link>)).toBe('<a href="/guide">Guide</a>')
})
