import { expect, test } from 'vitest'
import { isIgnoredPath } from './fs-router.js'

test('excludes colocated actions from route discovery', () => {
  expect(isIgnoredPath(['docs', '_actions', 'save.ts'])).toBe(true)
  expect(isIgnoredPath(['docs', 'actions', 'index.tsx'])).toBe(false)
})
