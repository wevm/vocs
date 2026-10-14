import { expect, test } from 'vitest'
import { patchReactDomPlugin, patchReactDomServerPlugin } from './patch-react-dom.js'

test.each([
  '/node_modules/react-dom/cjs/react-dom-client.development.js',
  '/node_modules/react-dom/cjs/react-dom-client.production.js',
  '/node_modules/.vite/deps/react-dom_client.js?v=123',
  'C:\\node_modules\\react-dom\\cjs\\react-dom-client.production.js',
])('ignores detached stylesheet preloads in %s', (id) => {
  const { transform } = patchReactDomPlugin()
  if (typeof transform !== 'function') throw new Error('Expected a callable transform hook')
  const code = '(hoistableRoot = resource.state.preload) && waitForPreload()'
  const patched = transform.call({} as never, code, id)
  expect(patched).toBe(
    '(hoistableRoot = resource.state.preload) && hoistableRoot.isConnected && waitForPreload()',
  )
  expect(transform.call({} as never, code, '/src/app.js')).toBeUndefined()
  expect(transform.call({} as never, 'unrelated()', id)).toBeUndefined()
})

test.each([
  '/node_modules/react-dom/cjs/react-dom-server.edge.development.js',
  '/node_modules/.vite/deps_ssr/react-dom-server.edge.development-abc123.js?v=1',
])('releases finished request context in %s', (id) => {
  const { transform } = patchReactDomServerPlugin()
  if (typeof transform !== 'function') throw new Error('Expected a callable transform hook')
  const released =
    '(prevDispatcher === HooksDispatcher ? switchContext(prevContext) : null !== currentRequest && 0 === currentRequest.allPendingTasks && switchContext(null))'
  // Published builds wrap the assignment in parentheses, while prebundled deps do not.
  for (const code of [
    'prevDispatcher === HooksDispatcher && switchContext(prevContext),\n  (currentRequest = prevRequest);',
    'prevDispatcher === HooksDispatcher && switchContext(prevContext), currentRequest = prevRequest;',
  ])
    expect(transform.call({} as never, code, id)).toBe(
      `${released},${code.includes('\n') ? '\n  ' : ' '}currentRequest = prevRequest;`,
    )
  // Nested task rendering restores its own request state and stays unchanged.
  const task =
    'prevDispatcher === HooksDispatcher && switchContext(prevContext), currentRequest = prevRequest, request.status = prevStatus;'
  expect(transform.call({} as never, task, id)).toBeUndefined()
  expect(
    transform.call(
      {} as never,
      task,
      '/node_modules/react-dom/cjs/react-dom-client.development.js',
    ),
  ).toBeUndefined()
})
