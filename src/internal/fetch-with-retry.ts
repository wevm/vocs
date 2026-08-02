const defaultRetryDelays = [250, 1_000] as const

export async function fetch(
  input: string,
  init: RequestInit,
  options: { retryDelays?: readonly number[] } = {},
): Promise<Response> {
  const retryDelays = options.retryDelays ?? defaultRetryDelays
  for (let attempt = 0; ; attempt++) {
    try {
      return await globalThis.fetch(input, init)
    } catch (error) {
      // Fetch rejects with TypeError for network failures. HTTP errors resolve normally.
      if (!(error instanceof TypeError) || init.signal?.aborted || attempt >= retryDelays.length)
        throw error
      await wait(retryDelays[attempt] ?? 0, init.signal)
    }
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
