import { describe, expect, test } from 'vitest'
import { unionVariantSchemas, unwrapSingleVariant } from './union.js'

describe('unwrapSingleVariant', () => {
  test('unwraps a nullable object union to its sole member', () => {
    const schema = {
      description: 'Access-key provisioning authorization.',
      oneOf: [
        { title: 'Null', type: 'null' },
        { type: 'object', properties: { keyId: { type: 'string' } } },
      ],
    }
    expect(unwrapSingleVariant(schema)).toEqual({
      type: 'object',
      properties: { keyId: { type: 'string' } },
      // the wrapper's description is preferred so field-level docs survive
      description: 'Access-key provisioning authorization.',
    })
  })

  test('prefers the member description when the wrapper has none', () => {
    const schema = {
      anyOf: [{ type: 'null' }, { type: 'object', description: 'inner' }],
    }
    expect(unwrapSingleVariant(schema)).toEqual({ type: 'object', description: 'inner' })
  })

  test('unwraps a single-member union without an explicit null', () => {
    const schema = { oneOf: [{ type: 'object', properties: {} }] }
    expect(unwrapSingleVariant(schema)).toEqual({ type: 'object', properties: {} })
  })

  test('returns undefined for two or more non-null members', () => {
    const schema = {
      oneOf: [{ type: 'null' }, { type: 'string' }, { type: 'number' }],
    }
    expect(unwrapSingleVariant(schema)).toBeUndefined()
  })

  test('returns undefined for non-unions', () => {
    expect(unwrapSingleVariant({ type: 'object', properties: {} })).toBeUndefined()
    expect(unwrapSingleVariant(undefined)).toBeUndefined()
  })

  test('does not collide with the variant picker (which needs >= 2 members)', () => {
    const nullable = { oneOf: [{ type: 'null' }, { type: 'object', properties: {} }] }
    // single non-null member: unwrapped, not shown as a picker
    expect(unwrapSingleVariant(nullable)).toBeDefined()
    expect(unionVariantSchemas(nullable)).toBeUndefined()
  })
})
