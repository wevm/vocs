import { describe, expect, it } from 'vitest'
import * as VectorStore from './vector-store.js'

describe('normalize', () => {
  it('produces a unit vector', () => {
    const v = VectorStore.normalize([3, 4])
    expect(v[0]).toBeCloseTo(0.6)
    expect(v[1]).toBeCloseTo(0.8)
    expect(Math.hypot(v[0] ?? 0, v[1] ?? 0)).toBeCloseTo(1)
  })

  it('passes zero vectors through', () => {
    expect([...VectorStore.normalize([0, 0, 0])]).toEqual([0, 0, 0])
  })
})

describe('pack/load/search', () => {
  const vectors = [
    VectorStore.normalize([1, 0, 0]),
    VectorStore.normalize([0, 1, 0]),
    VectorStore.normalize([0, 0, 1]),
  ]

  it('round-trips float32 and ranks the matching vector first', () => {
    const packed = VectorStore.pack(vectors, 'float32')
    expect(packed.format).toBe('float32')
    const store = VectorStore.load(packed)
    expect(store.count).toBe(3)
    expect(store.dimensions).toBe(3)

    const results = VectorStore.search(store, VectorStore.normalize([0.9, 0.1, 0]), 3)
    expect(results[0]?.index).toBe(0)
    expect(results[0]?.score ?? 0).toBeGreaterThan(results[1]?.score ?? 0)
  })

  it('round-trips int8 (quantized) and preserves ranking', () => {
    const packed = VectorStore.pack(vectors, 'int8')
    expect(packed.format).toBe('int8')
    expect(packed.scales).toBeTypeOf('string')
    const store = VectorStore.load(packed)

    const results = VectorStore.search(store, VectorStore.normalize([0, 0.2, 0.9]), 3)
    expect(results[0]?.index).toBe(2)
  })

  it('int8 scores approximate float32 scores', () => {
    const query = VectorStore.normalize([0.5, 0.5, 0.2])
    const f32 = VectorStore.search(VectorStore.load(VectorStore.pack(vectors, 'float32')), query, 1)
    const i8 = VectorStore.search(VectorStore.load(VectorStore.pack(vectors, 'int8')), query, 1)
    expect(i8[0]?.score ?? 0).toBeCloseTo(f32[0]?.score ?? 0, 1)
  })

  it('throws on dimension mismatch', () => {
    expect(() =>
      VectorStore.pack([new Float32Array([1, 0]), new Float32Array([1])], 'float32'),
    ).toThrow(/dimension mismatch/)
  })
})

describe('resolveFormat', () => {
  it('maps auto to float32 on server, int8 on client', () => {
    expect(VectorStore.resolveFormat('auto', 'server')).toBe('float32')
    expect(VectorStore.resolveFormat('auto', 'client')).toBe('int8')
    expect(VectorStore.resolveFormat('int8', 'server')).toBe('int8')
  })
})
