import { describe, expect, test } from 'vitest'
import {
  basePathPrefix,
  compile,
  isWithinBasePath,
  matches,
  stripBasePath,
  withBasePath,
} from './path.js'

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
    expect(withBasePath('/assets/md/index.md', '/')).toBe('/assets/md/index.md')
    expect(withBasePath('/assets/md/index.md', undefined)).toBe('/assets/md/index.md')
  })

  test('prefixes the base path', () => {
    expect(withBasePath('/assets/md/index.md', '/docs')).toBe('/docs/assets/md/index.md')
    expect(withBasePath('/assets/md/index.md', '/docs/')).toBe('/docs/assets/md/index.md')
  })
})

describe('stripBasePath', () => {
  test('leaves the path untouched for the root base path', () => {
    expect(stripBasePath('/assets/md/index.md', '/')).toBe('/assets/md/index.md')
    expect(stripBasePath('/assets/md/index.md', undefined)).toBe('/assets/md/index.md')
  })

  test('removes the base path', () => {
    expect(stripBasePath('/docs/assets/md/index.md', '/docs')).toBe('/assets/md/index.md')
    expect(stripBasePath('/docs/assets/md/index.md', '/docs/')).toBe('/assets/md/index.md')
  })

  test('maps the base path root to the root path', () => {
    expect(stripBasePath('/docs', '/docs')).toBe('/')
    expect(stripBasePath('/docs/', '/docs')).toBe('/')
  })

  test('leaves paths that only share a prefix untouched', () => {
    expect(stripBasePath('/docsearch/index.md', '/docs')).toBe('/docsearch/index.md')
  })

  test('leaves paths without the base path untouched', () => {
    expect(stripBasePath('/assets/md/index.md', '/docs')).toBe('/assets/md/index.md')
  })
})

describe('isWithinBasePath', () => {
  test('matches every path for the root base path', () => {
    expect(isWithinBasePath('/favicon.ico', '/')).toBe(true)
    expect(isWithinBasePath('/favicon.ico', undefined)).toBe(true)
  })

  test('matches the base path root', () => {
    expect(isWithinBasePath('/docs', '/docs')).toBe(true)
    expect(isWithinBasePath('/docs', '/docs/')).toBe(true)
    expect(isWithinBasePath('/docs/', '/docs')).toBe(true)
  })

  test('matches paths below the base path', () => {
    expect(isWithinBasePath('/docs/guide', '/docs')).toBe(true)
    expect(isWithinBasePath('/docs/assets/md/index.md', '/docs/')).toBe(true)
  })

  test('rejects paths that only share a prefix', () => {
    expect(isWithinBasePath('/docsearch', '/docs')).toBe(false)
    expect(isWithinBasePath('/docsearch/index.md', '/docs')).toBe(false)
    expect(isWithinBasePath('/docs-v2/guide', '/docs')).toBe(false)
  })

  test('rejects paths outside the base path', () => {
    expect(isWithinBasePath('/', '/docs')).toBe(false)
    expect(isWithinBasePath('/favicon.ico', '/docs')).toBe(false)
  })
})
