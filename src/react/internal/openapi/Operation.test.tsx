import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import type * as OpenApi from '../../../internal/openapi/index.js'
import { Operation } from './Operation.js'
import { Schema } from './Schema.js'

const operation: OpenApi.IrOperation = {
  id: 'getpet',
  method: 'GET',
  path: '/pets/{petId}',
  summary: 'Get a pet',
  description: 'Returns a **single** pet by id.',
  parameters: [
    {
      name: 'petId',
      in: 'path',
      required: true,
      description: 'The id of the pet',
      schema: { type: 'string' },
    },
    { name: 'expand', in: 'query', schema: { type: 'boolean' } },
  ],
  requestBody: undefined,
  responses: [
    {
      status: '200',
      description: 'A pet',
      content: [
        {
          mediaType: 'application/json',
          schema: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string', description: 'Pet id' },
              name: { type: 'string' },
            },
          },
        },
      ],
      headers: [],
    },
    { status: '404', description: 'Not found', content: [], headers: [] },
  ],
}

describe('Operation', () => {
  const html = renderToStaticMarkup(<Operation operation={operation} />)

  test('renders the heading, method and path', () => {
    expect(html).toContain('Get a pet')
    expect(html).toContain('id="getpet"')
    expect(html).toContain('>GET<')
    expect(html).toContain('/pets/{petId}')
  })

  test('renders the description as markdown', () => {
    expect(html).toContain('single</strong>')
  })

  test('renders parameters grouped by location', () => {
    expect(html).toContain('Path Parameters')
    expect(html).toContain('Query Parameters')
    expect(html).toContain('petId')
    expect(html).toContain('The id of the pet')
    expect(html).toContain('required')
  })

  test('pretty-prints structured parameter examples', () => {
    const html = renderToStaticMarkup(
      <Operation
        operation={{
          ...operation,
          parameters: [
            {
              name: 'filter',
              in: 'query',
              example: { status: 'active', limit: 10 },
              schema: { type: 'object' },
            },
          ],
        }}
      />,
    )
    expect(html).toContain(
      '{\n  &quot;status&quot;: &quot;active&quot;,\n  &quot;limit&quot;: 10\n}',
    )
  })

  test('renders responses with status and schema', () => {
    expect(html).toContain('>200<')
    expect(html).toContain('A pet')
    expect(html).toContain('>404<')
    // Response schema property names.
    expect(html).toContain('Pet id')
  })
})

describe('Schema', () => {
  test('pretty-prints structured property examples', () => {
    const html = renderToStaticMarkup(
      <Schema
        schema={{
          type: 'object',
          properties: {
            payload: { type: 'object', example: { signature: '0xabc', type: 'transaction' } },
          },
        }}
      />,
    )
    expect(html).toContain(
      '{\n  &quot;signature&quot;: &quot;0xabc&quot;,\n  &quot;type&quot;: &quot;transaction&quot;\n}',
    )
  })

  test('renders nested object properties recursively', () => {
    const html = renderToStaticMarkup(
      <Schema
        schema={{
          type: 'object',
          required: ['owner'],
          properties: {
            owner: {
              type: 'object',
              properties: { name: { type: 'string', description: 'Owner name' } },
            },
          },
        }}
      />,
    )
    expect(html).toContain('owner')
    expect(html).toContain('Owner name')
  })

  test('renders nothing for a schemaless value', () => {
    expect(renderToStaticMarkup(<Schema schema={undefined} />)).toBe('')
  })
})
