import { describe, expect, test } from 'vitest'
import { basePathPrefix, compile, matches, withBasePath, withBasePathAsset } from './path.js'

describe('compile', () => {
  test('compiles static path', () => {
    const [regex, params] = compile('/users')
    expect(regex.test('/users')).toBe(true)
    expect(regex.test('/users/')).toBe(true)
    expect(regex.test('/users/123')).toBe(false)
    expect(params).toEqual([])
  })

  test('compiles dynamic segment', () => {
    const [regex, params] = compile('/users/:id')
    expect(regex.test('/users/123')).toBe(true)
    expect(regex.test('/users/abc')).toBe(true)
    expect(regex.test('/users')).toBe(false)
    expect(params).toEqual([{ paramName: 'id', isOptional: false }])
  })

  test('compiles optional dynamic segment', () => {
    const [regex, params] = compile('/users/:id?')
    expect(regex.test('/users')).toBe(true)
    expect(regex.test('/users/')).toBe(true)
    expect(regex.test('/users/123')).toBe(true)
    expect(params).toEqual([{ paramName: 'id', isOptional: true }])
  })

  test('compiles splat route', () => {
    const [regex, params] = compile('/files/*')
    expect(regex.test('/files')).toBe(true)
    expect(regex.test('/files/')).toBe(true)
    expect(regex.test('/files/a/b/c')).toBe(true)
    expect(params).toEqual([{ paramName: '*' }])
  })

  test('respects caseSensitive option', () => {
    const [insensitive] = compile('/Users', false)
    const [sensitive] = compile('/Users', true)

    expect(insensitive.test('/users')).toBe(true)
    expect(sensitive.test('/users')).toBe(false)
    expect(sensitive.test('/Users')).toBe(true)
  })

  test('respects end option', () => {
    const [withEnd] = compile('/users', false, true)
    const [withoutEnd] = compile('/users', false, false)

    expect(withEnd.test('/users/123')).toBe(false)
    expect(withoutEnd.test('/users/123')).toBe(true)
  })
})

describe('matches', () => {
  test('returns match for matching path', () => {
    expect(matches('/users', '/users')).toBeTruthy()
    expect(matches('/users/123', '/users/:id')).toBeTruthy()
  })

  test('returns null for non-matching path', () => {
    expect(matches('/users/123', '/posts')).toBeFalsy()
    expect(matches('/users', '/users/:id')).toBeFalsy()
  })

  test('returns false for undefined target', () => {
    expect(matches('/users', undefined)).toBe(false)
  })

  test('handles trailing slashes', () => {
    expect(matches('/users/', '/users')).toBeTruthy()
    expect(matches('/users', '/users/')).toBeTruthy()
  })

  test('handles splat routes', () => {
    expect(matches('/docs/api/auth', '/docs/*')).toBeTruthy()
    expect(matches('/docs', '/docs/*')).toBeTruthy()
  })
})

describe('basePathPrefix', () => {
  test('returns an empty string for the root base path', () => {
    expect(basePathPrefix('/')).toBe('')
    expect(basePathPrefix('')).toBe('')
    expect(basePathPrefix(undefined)).toBe('')
  })

  test('strips the trailing slash', () => {
    expect(basePathPrefix('/docs')).toBe('/docs')
    expect(basePathPrefix('/docs/')).toBe('/docs')
  })
})

describe('withBasePath', () => {
  test('leaves the path untouched for the root base path', () => {
    expect(withBasePath('/api/feedback', '/')).toBe('/api/feedback')
    expect(withBasePath('/api/feedback', undefined)).toBe('/api/feedback')
  })

  test('prefixes the base path', () => {
    expect(withBasePath('/api/feedback', '/docs')).toBe('/docs/api/feedback')
    expect(withBasePath('/api/feedback', '/docs/')).toBe('/docs/api/feedback')
  })
})

describe('withBasePathAsset', () => {
  test('leaves the url untouched for the root base path', () => {
    expect(withBasePathAsset('/logo.svg', '/')).toBe('/logo.svg')
    expect(withBasePathAsset('/logo.svg', undefined)).toBe('/logo.svg')
  })

  test('prefixes root-absolute urls', () => {
    expect(withBasePathAsset('/logo.svg', '/docs')).toBe('/docs/logo.svg')
    expect(withBasePathAsset('/img/logo.svg', '/docs/')).toBe('/docs/img/logo.svg')
  })

  test('leaves urls that already include the base path untouched', () => {
    expect(withBasePathAsset('/docs/logo.svg', '/docs')).toBe('/docs/logo.svg')
    expect(withBasePathAsset('/docs/logo.svg', '/docs/')).toBe('/docs/logo.svg')
  })

  test('prefixes urls that only share a prefix with the base path', () => {
    expect(withBasePathAsset('/docsearch.svg', '/docs')).toBe('/docs/docsearch.svg')
  })

  test('leaves external, relative and data urls untouched', () => {
    expect(withBasePathAsset('https://example.com/logo.svg', '/docs')).toBe(
      'https://example.com/logo.svg',
    )
    expect(withBasePathAsset('//cdn.example.com/logo.svg', '/docs')).toBe(
      '//cdn.example.com/logo.svg',
    )
    expect(withBasePathAsset('logo.svg', '/docs')).toBe('logo.svg')
    expect(withBasePathAsset('data:image/svg+xml,<svg/>', '/docs')).toBe(
      'data:image/svg+xml,<svg/>',
    )
  })
})
