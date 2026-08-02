const defaultRetryDelays = [250, 1_000] as const

export async function withRetry<value>(
  fn: () => Promise<value>,
  options: withRetry.Options = {},
): Promise<value> {
  const { retryDelays = defaultRetryDelays, shouldRetry = () => true, signal } = options
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (signal?.aborted || attempt >= retryDelays.length || !shouldRetry(error)) throw error
      await wait(retryDelays[attempt] ?? 0, signal)
    }
  }
}

export declare namespace withRetry {
  type Options = {
    retryDelays?: readonly number[] | undefined
    shouldRetry?: ((error: unknown) => boolean) | undefined
    signal?: AbortSignal | null | undefined
  }
}

async function wait(delay: number, signal?: AbortSignal | null): Promise<void> {
  if (signal?.aborted) throw signal.reason
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(done, delay)
    signal?.addEventListener('abort', aborted, { once: true })

    function aborted() {
      clearTimeout(timeout)
      reject(signal?.reason)
    }

    function done() {
      signal?.removeEventListener('abort', aborted)
      resolve()
    }
  })
}
