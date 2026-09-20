import { expect, test } from 'vitest'
import { patchReactDomPlugin } from './patch-react-dom.js'

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
