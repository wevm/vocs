import { afterEach, describe, expect, it, vi } from 'vitest'
import { getApiHandlers, hasInvalidStaticApiExports } from './api-routes.js'

const POST = async () => new Response(null)
const GET = async () => new Response(null)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getApiHandlers', () => {
  it('ignores non-function synthetic exports', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const handlers = getApiHandlers({ POST, t: { id: 123 } }, '/_api/faucet')

    expect(handlers).toEqual({ POST })
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns on exported helper functions', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fund = async () => new Response(null)

    const handlers = getApiHandlers({ POST, fund }, '/_api/faucet')

    expect(handlers).toEqual({ POST })
    expect(warn).toHaveBeenCalledWith(
      'API /_api/faucet has an invalid export: fund. Valid exports are: GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH',
    )
  })

  it('maps default exports to all handlers', () => {
    const handler = async () => new Response(null)

    expect(getApiHandlers({ default: handler }, '/_api/faucet')).toEqual({ all: handler })
  })
})

describe('hasInvalidStaticApiExports', () => {
  it('ignores non-function synthetic exports', () => {
    expect(hasInvalidStaticApiExports({ GET, t: { id: 123 } })).toBe(false)
  })

  it('rejects non-GET route handlers and helper functions', () => {
    const fund = async () => new Response(null)

    expect(hasInvalidStaticApiExports({ GET, POST })).toBe(true)
    expect(hasInvalidStaticApiExports({ GET, fund })).toBe(true)
  })
})
