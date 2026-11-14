/**
 * Provider adapters forward the agent's OpenAI Responses API requests to an LLM provider. The
 * handler checks each request before an adapter sees it. `cloudflare` forwards to Cloudflare AI
 * Gateway, and `from` wraps a custom upstream.
 * @module
 */

/** An LLM provider. */
export type Provider = {
  /** Forwards one Responses API request body and returns the provider's streamed response. */
  complete(body: string, context: Context): Promise<Response>
  /** The only model IDs the handler forwards. */
  models: readonly string[]
  /** Backend name, such as `cloudflare`. */
  type: string
}

/** Request-scoped values the handler passes to an adapter. */
export type Context = {
  /** Environment values and bindings of the request. */
  env: Record<string, unknown>
  /** Aborts when the reader's request ends. */
  signal: AbortSignal
}

/**
 * Cloudflare AI Gateway. Reads `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from the
 * environment on every request, and calls the gateway's OpenAI endpoint with unified billing.
 *
 * @example
 * ```ts
 * Provider.cloudflare({ gateway: 'docs', models: ['gpt-6-luna'] })
 * ```
 */
export function cloudflare(options: cloudflare.Options): Provider {
  return {
    async complete(body, context) {
      const account = context.env.CLOUDFLARE_ACCOUNT_ID
      const token = context.env.CLOUDFLARE_API_TOKEN
      if (typeof account !== 'string' || typeof token !== 'string' || !account || !token)
        throw new MissingCredentialsError()
      return fetch(
        `https://gateway.ai.cloudflare.com/v1/${account}/${options.gateway}/openai/responses`,
        {
          body,
          headers: {
            accept: 'text/event-stream',
            'cf-aig-authorization': `Bearer ${token}`,
            'content-type': 'application/json',
          },
          method: 'POST',
          signal: context.signal,
        },
      )
    },
    models: options.models,
    type: 'cloudflare',
  }
}

export declare namespace cloudflare {
  type Options = {
    /** AI Gateway name in the account. */
    gateway: string
    /** Model IDs the handler forwards, such as `gpt-6-luna`. */
    models: readonly string[]
  }
}

/** Wraps a custom upstream. */
export function from(options: from.Options): Provider {
  return { type: 'custom', ...options }
}

export declare namespace from {
  type Options = Pick<Provider, 'complete' | 'models'> & Partial<Pick<Provider, 'type'>>
}

/** Thrown when `Provider.cloudflare` runs without its credentials. */
export class MissingCredentialsError extends Error {
  override name = 'Provider.MissingCredentialsError'
  constructor() {
    super(
      'Provider "cloudflare" has no credentials. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in the environment.',
    )
  }
}
