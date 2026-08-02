import { afterEach, describe, expect, it, vi } from 'vitest'
import * as FetchWithRetry from './fetch-with-retry.js'

afterEach(() => vi.restoreAllMocks())

describe('fetch', () => {
  it('retries transient network failures', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('ok'))

    const response = await FetchWithRetry.fetch('https://example.com', {}, { retryDelays: [0, 0] })

    expect(await response.text()).toBe('ok')
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting retries', async () => {
    const error = new TypeError('fetch failed')
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(error)

    await expect(
      FetchWithRetry.fetch('https://example.com', {}, { retryDelays: [0, 0] }),
    ).rejects.toBe(error)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('does not retry non-network failures', async () => {
    const error = new Error('invalid request')
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(error)

    await expect(
      FetchWithRetry.fetch('https://example.com', {}, { retryDelays: [0, 0] }),
    ).rejects.toBe(error)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('stops retrying when aborted', async () => {
    const controller = new AbortController()
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      controller.abort(new Error('aborted'))
      throw new TypeError('fetch failed')
    })

    await expect(
      FetchWithRetry.fetch(
        'https://example.com',
        { signal: controller.signal },
        { retryDelays: [0, 0] },
      ),
    ).rejects.toThrow('fetch failed')
    expect(fetch).toHaveBeenCalledOnce()
  })
})
