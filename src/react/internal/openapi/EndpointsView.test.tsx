import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import type { Ir } from '../../../internal/openapi/parser.js'
import { EndpointsView } from './EndpointsView.js'

const ir = {
  path: '/api',
  groups: [
    {
      id: 'rpc',
      name: 'RPC',
      operations: [
        { id: 'eth_blocknumber', method: 'POST', path: '/', summary: 'eth_blockNumber' },
        { id: 'eth_call', method: 'POST', path: '/', summary: 'eth_call' },
      ],
    },
    {
      id: 'admin',
      name: 'Admin',
      operations: [{ id: 'admin_peers', method: 'POST', path: '/', summary: 'admin_peers' }],
    },
  ],
} as unknown as Ir

describe('EndpointsView', () => {
  test('renders the accordion of all categories by default', () => {
    const html = renderToStaticMarkup(<EndpointsView ir={ir} href={(to) => to} />)
    expect(html).toContain('data-v-openapi-overview')
    expect(html).toContain('eth_blockNumber')
    expect(html).toContain('admin_peers')
  })

  test('resource renders a single category as a flat list', () => {
    const html = renderToStaticMarkup(<EndpointsView ir={ir} href={(to) => to} resource="rpc" />)
    expect(html).toContain('data-v-openapi-overview-resource')
    // Operations of the matched resource are listed...
    expect(html).toContain('eth_blockNumber')
    expect(html).toContain('eth_call')
    expect(html).toContain('href="/api/rpc#eth_blocknumber"')
    // ...and other categories are excluded.
    expect(html).not.toContain('admin_peers')
    // No accordion wrapper is rendered.
    expect(html).not.toContain('data-v-openapi-overview-category')
  })

  test('resource matches case-insensitively by name', () => {
    const html = renderToStaticMarkup(<EndpointsView ir={ir} href={(to) => to} resource="admin" />)
    expect(html).toContain('admin_peers')
    expect(html).not.toContain('eth_blockNumber')
  })

  test('resource reports when no category matches', () => {
    const html = renderToStaticMarkup(
      <EndpointsView ir={ir} href={(to) => to} resource="missing" />,
    )
    expect(html).toContain('No resource named')
  })
})
