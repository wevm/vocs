import { describe, expect, test } from 'vitest'
import { stripDuplicateTitle } from './changelog.js'

describe('stripDuplicateTitle', () => {
  test('strips a leading H1 that duplicates the title', () => {
    expect(stripDuplicateTitle({ body: '# v1.0.0\n\nBody text.', title: 'v1.0.0' })).toBe(
      'Body text.',
    )
  })

  test('keeps a leading H1 that differs from the title', () => {
    const body = '# Breaking Changes\n\nBody text.'
    expect(stripDuplicateTitle({ body, title: 'v1.0.0' })).toBe(body)
  })

  test('matches loosely across case, whitespace and unicode dashes', () => {
    expect(
      stripDuplicateTitle({
        body: '# Release v1.6.0 — T3  Update\n\nBody.',
        title: 'release v1.6.0 - t3 update',
      }),
    ).toBe('Body.')
  })

  test('returns the body unchanged when body or title is empty', () => {
    expect(stripDuplicateTitle({ body: '', title: 'v1.0.0' })).toBe('')
    expect(stripDuplicateTitle({ body: '# v1.0.0\n\nBody.', title: '' })).toBe('# v1.0.0\n\nBody.')
  })
})
