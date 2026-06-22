import { describe, expect, test } from 'vitest'
import type { IrOperation } from './parser.js'
import { codeSamples, harRequest, responseSamples } from './sample.js'

const operation: IrOperation = {
  id: 'createpet',
  method: 'POST',
  path: '/pets/{petId}',
  parameters: [
    { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
    { name: 'limit', in: 'query', required: true, schema: { type: 'integer' } },
    { name: 'dryRun', in: 'query', schema: { type: 'boolean' } },
  ],
  requestBody: {
    content: [
      {
        mediaType: 'application/json',
        schema: {
          type: 'object',
          properties: { name: { type: 'string' }, age: { type: 'integer' } },
        },
      },
    ],
  },
  responses: [
    {
      status: '200',
      description: 'A pet',
      content: [
        {
          mediaType: 'application/json',
          schema: { type: 'object', properties: { id: { type: 'string' } } },
        },
      ],
      headers: [],
    },
    { status: '404', description: 'Not found', content: [], headers: [] },
  ],
}

describe('harRequest', () => {
  test('fills path params, required query/body, and resolves the server', () => {
    const request = harRequest(operation, 'https://api.example.com/')
    expect(request.method).toBe('POST')
    expect(request.url).toBe('https://api.example.com/pets/string')
    // All non-deprecated query params are included (required and optional).
    expect(request.queryString).toEqual([
      { name: 'limit', value: '0' },
      { name: 'dryRun', value: 'true' },
    ])
    expect(request.postData?.mimeType).toBe('application/json')
    expect(JSON.parse(request.postData?.text ?? '{}')).toEqual({ name: 'string', age: 0 })
    expect(request.headers).toContainEqual({ name: 'Content-Type', value: 'application/json' })
  })
})

describe('codeSamples', () => {
  test('generates cURL and TypeScript fetch snippets', () => {
    const samples = codeSamples(operation, 'https://api.example.com')
    expect(samples.map((sample) => sample.id)).toEqual(['shell/curl', 'js/fetch'])
    const curl = samples.find((sample) => sample.id === 'shell/curl')
    expect(curl?.lang).toBe('bash')
    expect(curl?.code).toContain('curl')
    expect(curl?.code).toContain('https://api.example.com/pets/string')
    const ts = samples.find((sample) => sample.id === 'js/fetch')
    expect(ts?.label).toBe('TypeScript')
    expect(ts?.lang).toBe('ts')
  })

  test('anchors query parameters to their schema rows per line', () => {
    const samples = codeSamples(operation, 'https://api.example.com')
    const curl = samples.find((sample) => sample.id === 'shell/curl')
    // Each query parameter is on its own line, so the whole line is anchored.
    const lineIds = (curl?.lineAnchors ?? []).filter(Boolean)
    expect(lineIds).toContain('createpet-limit')
    expect(lineIds).toContain('createpet-dryrun')
    // The anchored line indices correspond to the `?limit`/`&dryRun` lines.
    const lines = curl?.display.split('\n') ?? []
    curl?.lineAnchors.forEach((id, index) => {
      if (id) expect(lines[index]?.trim()).toMatch(/^'?[?&]/)
    })
  })

  test('color-codes query parameter names and values', () => {
    const samples = codeSamples(operation, 'https://api.example.com')
    const curl = samples.find((sample) => sample.id === 'shell/curl')
    const ranges = curl?.colorRanges ?? []
    // Each query param contributes a `key` (name) and a `value` range.
    const display = curl?.display ?? ''
    const keys = ranges.filter((r) => r.kind === 'key').map((r) => display.slice(...r.range))
    const values = ranges.filter((r) => r.kind === 'value').map((r) => display.slice(...r.range))
    // The key range includes the leading `?`/`&` separator so it's colored too.
    expect(keys).toContain('?limit')
    expect(keys).toContain('&dryRun')
    expect(values).toContain('0')
    expect(values).toContain('true')
  })

  test('places each query parameter on its own line', () => {
    const samples = codeSamples(operation, 'https://api.example.com')
    const curl = samples.find((sample) => sample.id === 'shell/curl')
    // Copy text stays single-line/valid; the display variant is broken up.
    expect(curl?.code).toContain('?limit=0&dryRun=true')
    expect(curl?.display).toContain('\n  ?limit=0')
    expect(curl?.display).toContain('\n  &dryRun=true')
    const ts = samples.find((sample) => sample.id === 'js/fetch')
    expect(ts?.display).toContain("'?limit=0'")
    expect(ts?.display).toContain("'&dryRun=true'")
  })

  test('collapses query parameters beyond the first 2', () => {
    const many: IrOperation = {
      ...operation,
      parameters: [
        { name: 'a', in: 'query', schema: { type: 'string' } },
        { name: 'b', in: 'query', schema: { type: 'string' } },
        { name: 'c', in: 'query', schema: { type: 'string' } },
        { name: 'd', in: 'query', schema: { type: 'string' } },
        { name: 'e', in: 'query', schema: { type: 'string' } },
      ],
    }
    const curl = codeSamples(many).find((sample) => sample.id === 'shell/curl')
    expect(curl?.hiddenQueryCount).toBe(3)
    // Collapsed variant has the first 2 query params, full has all 5.
    expect(curl?.collapsed?.display).toContain('?a=')
    expect(curl?.collapsed?.display).toContain('&b=')
    expect(curl?.collapsed?.display).not.toContain('&c=')
    expect(curl?.display).toContain('&e=')
  })

  test('does not collapse 2 or fewer query parameters', () => {
    const curl = codeSamples(operation).find((sample) => sample.id === 'shell/curl')
    expect(curl?.collapsed).toBeUndefined()
    expect(curl?.hiddenQueryCount).toBeUndefined()
  })
})

describe('responseSamples', () => {
  test('builds JSON samples only for responses with a JSON schema/example', () => {
    const samples = responseSamples(operation)
    expect(samples.map((sample) => sample.status)).toEqual(['200'])
    expect(samples[0]?.lang).toBe('json')
    expect(JSON.parse(samples[0]?.code ?? '{}')).toEqual({ id: 'string' })
  })

  test('marks synthesized placeholder values via offset ranges', () => {
    const samples = responseSamples(operation)
    const sample = samples[0]
    expect(sample?.placeholders).toHaveLength(1)
    const [start, end] = sample?.placeholders[0] ?? [0, 0]
    expect(sample?.code.slice(start, end)).toBe('"string"')
  })

  test('authored examples have no placeholders', () => {
    const samples = responseSamples({
      ...operation,
      responses: [
        {
          status: '200',
          description: 'A pet',
          content: [{ mediaType: 'application/json', example: { id: 'abc' } }],
          headers: [],
        },
      ],
    })
    expect(samples[0]?.placeholders).toEqual([])
    expect(JSON.parse(samples[0]?.code ?? '{}')).toEqual({ id: 'abc' })
  })

  test('exposes a status-scoped id base for anchor resolution', () => {
    const samples = responseSamples(operation)
    expect(samples[0]?.idBase).toBe('createpet-response-200')
  })

  test('records per-line schema paths for nested objects and arrays', () => {
    const samples = responseSamples({
      ...operation,
      responses: [
        {
          status: '200',
          description: 'ok',
          content: [
            {
              mediaType: 'application/json',
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: { type: 'object', properties: { id: { type: 'string' } } },
                      },
                    },
                  },
                },
              },
            },
          ],
          headers: [],
        },
      ],
    })
    const sample = samples[0]
    const lines = sample?.code.split('\n') ?? []
    const paths = sample?.linePaths ?? []
    // Find the line for the nested `id` and assert its recorded path.
    const idLine = lines.findIndex((line) => line.includes('"id"'))
    expect(paths[idLine]).toEqual(['data', 'items', 'id'])
    // The `data` opening line maps to `['data']`.
    const dataLine = lines.findIndex((line) => line.includes('"data"'))
    expect(paths[dataLine]).toEqual(['data'])
    // Closing braces carry no path.
    const closingLine = lines.length - 1
    expect(paths[closingLine]).toBeUndefined()
  })

  test('qualifies union variant paths so they match the variant picker rows', () => {
    const samples = responseSamples({
      ...operation,
      responses: [
        {
          status: '200',
          description: 'ok',
          content: [
            {
              mediaType: 'application/json',
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      anyOf: [
                        {
                          title: 'Transfer',
                          type: 'object',
                          properties: { amount: { type: 'string' } },
                        },
                        {
                          title: 'Mint',
                          type: 'object',
                          properties: { supply: { type: 'string' } },
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
          headers: [],
        },
      ],
    })
    const sample = samples[0]
    const lines = sample?.code.split('\n') ?? []
    const paths = sample?.linePaths ?? []
    // The sampled variant (index 0) qualifies its children with `variant-0`.
    const amountLine = lines.findIndex((line) => line.includes('"amount"'))
    expect(paths[amountLine]).toEqual(['data', 'variant-0', 'amount'])
  })

  test('authored examples still record per-line schema paths', () => {
    const samples = responseSamples({
      ...operation,
      responses: [
        {
          status: '200',
          description: 'ok',
          content: [{ mediaType: 'application/json', example: { id: 'abc', nested: { x: 1 } } }],
          headers: [],
        },
      ],
    })
    const sample = samples[0]
    const lines = sample?.code.split('\n') ?? []
    const paths = sample?.linePaths ?? []
    const xLine = lines.findIndex((line) => line.includes('"x"'))
    expect(paths[xLine]).toEqual(['nested', 'x'])
  })
})
