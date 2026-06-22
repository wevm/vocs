import { describe, expect, test } from 'vitest'
import * as OpenApi from './openapi.js'
import { expand } from './openrpc.js'
import { parse } from './parser.js'
import { codeSamples } from './sample.js'

const openrpc = {
  openrpc: '1.2.4',
  info: { title: 'Demo JSON-RPC', version: '1.0.0' },
  components: {
    schemas: {
      address: { type: 'string', title: 'hex address' },
      uint: { type: 'string', title: 'hex uint' },
    },
  },
  methods: [
    {
      name: 'eth_blockNumber',
      summary: 'Returns the current block number.',
      params: [],
      result: { name: 'Block number', schema: { $ref: '#/components/schemas/uint' } },
      examples: [{ name: 'ex', params: [], result: { name: 'r', value: '0x10' } }],
    },
    {
      name: 'eth_getBalance',
      summary: 'Returns the balance of an account.',
      params: [
        { name: 'Address', required: true, schema: { $ref: '#/components/schemas/address' } },
        { name: 'Block', required: true, schema: { $ref: '#/components/schemas/uint' } },
      ],
      result: { name: 'Balance', schema: { $ref: '#/components/schemas/uint' } },
      examples: [
        {
          name: 'ex',
          params: [
            { name: 'Address', value: '0xabc' },
            { name: 'Block', value: 'latest' },
          ],
          result: { name: 'Balance', value: '0x1' },
        },
      ],
    },
  ],
}

const host = {
  id: 'rpc-request',
  method: 'POST',
  path: '/v1/rpc',
  summary: 'Query RPC',
  parameters: [],
  responses: [],
}

describe('expand', () => {
  test('expands one operation per JSON-RPC method', async () => {
    const operations = await expand(host, openrpc)

    expect(operations.map((operation) => operation.summary)).toEqual([
      'eth_blockNumber',
      'eth_getBalance',
    ])

    const balance = operations[1]
    if (!balance) throw new Error('expected eth_getBalance operation')
    // All methods reuse the host transport (POST /v1/rpc).
    expect(balance.method).toBe('POST')
    expect(balance.path).toBe('/v1/rpc')
    expect(balance.id).toBe('eth_getbalance')
    expect(balance.description).toContain('balance')

    // Params are surfaced like path/query params, with refs dereferenced.
    expect(balance.parameters.map((p) => [p.name, p.in, p.example])).toEqual([
      ['Address', 'rpc', '0xabc'],
      ['Block', 'rpc', 'latest'],
    ])
    expect(balance.parameters[0]?.schema).toMatchObject({ type: 'string' })

    // The request body is the JSON-RPC envelope, hidden from its own section.
    expect(balance.requestBody?.hidden).toBe(true)
    expect(balance.requestBody?.content[0]?.example).toEqual({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: ['0xabc', 'latest'],
    })

    // The result is wrapped in a JSON-RPC response envelope.
    expect(balance.responses[0]?.status).toBe('200')
    expect(balance.responses[0]?.content[0]?.example).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: '0x1',
    })
  })

  test('generates an accurate JSON-RPC request code sample', async () => {
    const [, balance] = await expand(host, openrpc)
    if (!balance) throw new Error('expected eth_getBalance operation')
    const samples = codeSamples(balance, 'https://api.example.com')
    const curl = samples.find((sample) => sample.id === 'shell/curl')
    expect(curl?.code).toContain('https://api.example.com/v1/rpc')
    expect(curl?.code).toContain('"method": "eth_getBalance"')
    expect(curl?.code).toContain('"params"')
  })
})

describe('parse with x-openrpc', () => {
  const spec = {
    openapi: '3.1.0',
    info: { title: 'API', version: '1.0.0' },
    tags: [{ name: 'RPC', description: 'JSON-RPC passthrough.' }],
    paths: {
      '/v1/rpc': {
        post: {
          operationId: 'rpcRequest',
          summary: 'Query RPC',
          tags: ['RPC'],
          'x-openrpc': openrpc,
          responses: { '200': { description: 'ok' } },
        },
      },
    },
  }

  test('replaces the host operation with expanded methods', async () => {
    const ir = await parse(OpenApi.from({ spec, path: '/api' }))
    const group = ir.groups.find((candidate) => candidate.name === 'RPC')
    expect(group?.operations.map((operation) => operation.summary)).toEqual([
      'eth_blockNumber',
      'eth_getBalance',
    ])
  })
})
