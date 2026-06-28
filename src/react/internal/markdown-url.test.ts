import { describe, expect, test } from 'vitest'
import { getMarkdownAssetPath } from './markdown-url.js'

describe('getMarkdownAssetPath', () => {
  test('returns the generated markdown asset path for the root page', () => {
    expect(getMarkdownAssetPath('/')).toBe('/assets/md/index.md')
  })

  test('returns the generated markdown asset path for a nested page', () => {
    expect(getMarkdownAssetPath('/docs/getting-started')).toBe('/assets/md/docs/getting-started.md')
  })

  test('removes trailing slashes from page paths', () => {
    expect(getMarkdownAssetPath('/docs/')).toBe('/assets/md/docs.md')
  })
})
