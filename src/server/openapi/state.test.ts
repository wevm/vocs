import { describe, expect, test } from 'vitest'
import { prepare } from './state.js'

describe('prepare', () => {
  test('keeps server-only Vocs config out of the browser payload', async () => {
    const payload = await prepare({
      path: '/api',
      spec: { openapi: '3.1.0', info: { title: 'Public API', version: '1.0.0' }, paths: {} },
      vocs: {
        rootDir: '/tmp/private-openapi-root',
        mcp: {
          enabled: true,
          sources: [
            {
              type: 'custom',
              async listFiles() {
                return []
              },
              async readFile() {
                return 'private-openapi-token'
              },
              async getTree() {
                return { files: [], truncated: false }
              },
            },
          ],
        },
      },
    })

    expect(payload.config.title).toBe('Public API')
    expect(payload.config.mcp).toEqual({ enabled: true })
    expect(JSON.stringify(payload.config)).not.toContain('private-openapi-root')
    expect(JSON.stringify(payload.config)).not.toContain('private-openapi-token')
  })

  test('nests trait parents by original tag identity', async () => {
    const payload = await prepare({
      path: '/api',
      spec: {
        openapi: '3.1.0',
        info: { title: 'Funding', version: '1.0.0' },
        tags: [
          { name: 'Funding Transfers', 'x-displayName': 'Transfers' },
          {
            name: 'Funding guide',
            description: 'Funding guide.',
            'x-parent': 'Funding Transfers',
            'x-traitTag': true,
          },
        ],
        paths: {
          '/funding/transfers': {
            get: {
              operationId: 'listFundingTransfers',
              tags: ['Funding Transfers'],
              responses: { '200': {} },
            },
          },
        },
      },
    })

    expect(payload.sidebar).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Transfers',
          items: expect.arrayContaining([
            expect.objectContaining({ link: '/api/funding-guide', text: 'Funding guide' }),
          ]),
        }),
      ]),
    )
    expect(payload.sidebar).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ text: 'Funding Transfers' })]),
    )
  })
})
