import { describe, expect, it } from 'vitest'
import { tokenize } from './prompt.js'

describe('tokenize', () => {
  it('detects prompt structure without changing its text', () => {
    const value = [
      'Read https://vocs.dev/introduction/getting-started and update `vocs.config.ts`.',
      '',
      'Requirements:',
      '- Preserve existing navigation',
      '- Replace <PROJECT_NAME> with {{package}} and run $COMMAND.',
    ].join('\n')
    const tokens = tokenize(value)

    expect(tokens.map((token) => token.value).join('')).toBe(value)
    expect(tokens.filter((token) => token.type !== 'text')).toEqual([
      { type: 'url', value: 'https://vocs.dev/introduction/getting-started' },
      { type: 'code', value: '`vocs.config.ts`' },
      { type: 'label', value: 'Requirements:' },
      { type: 'marker', value: '-' },
      { type: 'marker', value: '-' },
      { type: 'placeholder', value: '<PROJECT_NAME>' },
      { type: 'placeholder', value: '{{package}}' },
      { type: 'placeholder', value: '$COMMAND' },
    ])
  })

  it('keeps trailing URL punctuation outside the link', () => {
    const value = 'Read (https://vocs.dev/docs), then continue.'
    const tokens = tokenize(value)

    expect(tokens.map((token) => token.value).join('')).toBe(value)
    expect(tokens.find((token) => token.type === 'url')).toEqual({
      type: 'url',
      value: 'https://vocs.dev/docs',
    })
  })

  it('does not tokenize prompt syntax inside inline code', () => {
    const value = 'Keep `https://example.com/<PROJECT>` literal.'
    expect(tokenize(value).filter((token) => token.type !== 'text')).toEqual([
      { type: 'code', value: '`https://example.com/<PROJECT>`' },
    ])
  })
})
