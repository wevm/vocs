import { describe, expect, test } from 'vitest'
import type { Ir, IrOperation } from '../../../internal/openapi/parser.js'
import { findOperation } from './find-operation.js'

function operation(partial: Partial<IrOperation> & Pick<IrOperation, 'id' | 'method' | 'path'>) {
  return { parameters: [], responses: [], ...partial } as IrOperation
}

const ir = {
  groups: [
    {
      id: 'blocks',
      name: 'Blocks',
      operations: [
        operation({ id: 'getblocks', method: 'GET', path: '/v1/blocks' }),
        operation({ id: 'getblock', method: 'GET', path: '/v1/blocks/{block}' }),
      ],
    },
    {
      id: 'transactions',
      name: 'Transactions',
      operations: [
        operation({ id: 'gettransaction', method: 'GET', path: '/v1/transactions/{transaction}' }),
      ],
    },
  ],
} as unknown as Ir

describe('findOperation', () => {
  test('matches by exact operation id', () => {
    expect(findOperation(ir, { operationId: 'getblock' })?.path).toBe('/v1/blocks/{block}')
  })

  test('matches by slugified operationId (spec camelCase)', () => {
    expect(findOperation(ir, { operationId: 'getBlocks' })?.id).toBe('getblocks')
  })

  test('matches by method + path (method case-insensitive)', () => {
    expect(findOperation(ir, { method: 'get', path: '/v1/transactions/{transaction}' })?.id).toBe(
      'gettransaction',
    )
  })

  test('returns undefined when nothing matches', () => {
    expect(findOperation(ir, { operationId: 'nope' })).toBeUndefined()
    expect(findOperation(ir, { method: 'GET', path: '/missing' })).toBeUndefined()
    expect(findOperation(ir, {})).toBeUndefined()
  })
})
