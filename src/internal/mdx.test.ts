import { describe, expect, test } from 'vitest'
import { rehypeShiki } from './mdx.js'

describe('rehypeShiki', () => {
  test('preserves caller-provided language inference', () => {
    const [, options] = rehypeShiki({ langs: ['ts', 'solidity'] })

    expect(options.langs).toEqual(['ts', 'solidity'])
  })

  test('falls back to default bundled languages when no langs are provided', () => {
    const [, options] = rehypeShiki({})
    const langs = options.langs ?? []

    expect(langs.length).toBeGreaterThan(2)
  })
})
