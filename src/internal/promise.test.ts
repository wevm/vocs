import { afterEach, describe, expect, it, vi } from 'vitest'
import * as promise from './promise.js'

afterEach(() => vi.useRealTimers())

describe('withRetry', () => {
  it('retries failures', async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('failed'))
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce('ok')

    await expect(promise.withRetry(fn, { baseMs: 0 })).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting retries', async () => {
    const error = new Error('failed')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(promise.withRetry(fn, { baseMs: 0 })).rejects.toBe(error)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('only retries matching failures', async () => {
    const error = new Error('invalid request')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(
      promise.withRetry(fn, {
        baseMs: 0,
        shouldRetry: (error) => error instanceof TypeError,
      }),
    ).rejects.toBe(error)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('stops retrying when aborted', async () => {
    const controller = new AbortController()
    const fn = vi.fn().mockImplementation(async () => {
      controller.abort(new Error('aborted'))
      throw new Error('failed')
    })

    await expect(
      promise.withRetry(fn, {
        baseMs: 0,
        signal: controller.signal,
      }),
    ).rejects.toThrow('failed')
    expect(fn).toHaveBeenCalledOnce()
  })

  it('cancels the retry delay when aborted', async () => {
    const controller = new AbortController()
    const error = new Error('aborted')
    const fn = vi.fn().mockRejectedValue(new Error('failed'))
    const retry = promise.withRetry(fn, {
      baseMs: 100,
      signal: controller.signal,
    })

    setTimeout(() => controller.abort(error), 0)

    await expect(retry).rejects.toBe(error)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('backs off exponentially', async () => {
    vi.useFakeTimers()
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('failed'))
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce('ok')
    const retry = promise.withRetry(fn, { baseMs: 100 })

    await vi.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(199)
    expect(fn).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)

    await expect(retry).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
