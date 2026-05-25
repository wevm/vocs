import { describe, expect, test } from 'vitest'
import { compile, matches } from './path.js'

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
