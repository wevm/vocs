import { describe, expect, test } from 'vitest'
import { resolveMcpUrl } from './resolveMcpUrl.js'

describe('resolveMcpUrl', () => {
  test('defaults to the same-origin MCP endpoint', () => {
    expect(resolveMcpUrl({ enabled: true }, 'https://vocs.dev')).toBe('https://vocs.dev/api/mcp')
  })

  test('uses the configured MCP URL', () => {
    expect(
      resolveMcpUrl({ enabled: true, url: 'https://mcp.example.com/mcp' }, 'https://vocs.dev'),
    ).toBe('https://mcp.example.com/mcp')
  })
})
