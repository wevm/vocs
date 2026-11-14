/**
 * Storage adapters keep saved pages, so each kept page has a permalink. The handler stores one
 * JSON value per page. `cloudflare` uses a Workers KV namespace, `memory` keeps values in process
 * memory for development and tests, and `from` wraps a custom backend.
 * @module
 */

/** A key-value store for saved pages. */
export type Storage = {
  /** Returns the value of `key`, or `undefined` when it does not exist. */
  get(key: string, context: Context): Promise<string | undefined>
  /** Writes `value` under `key`. */
  put(key: string, value: string, context: Context): Promise<void>
  /** Backend name, such as `cloudflare`. */
  type: string
}

/** Request-scoped values the handler passes to an adapter. */
export type Context = {
  /** Environment values and bindings of the request. */
  env: Record<string, unknown>
}

/** The part of a Workers KV namespace binding that `cloudflare` uses. */
export type KvNamespace = {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

/**
 * A Workers KV namespace. Reads the binding from the environment on every call.
 *
 * @example
 * ```ts
 * Storage.cloudflare({ binding: 'PAGES' })
 * ```
 */
export function cloudflare(options: cloudflare.Options): Storage {
  function namespace(context: Context): KvNamespace {
    const binding = context.env[options.binding] as KvNamespace | undefined
    if (typeof binding?.get !== 'function' || typeof binding.put !== 'function')
      throw new MissingBindingError({ binding: options.binding })
    return binding
  }

  return {
    async get(key, context) {
      return (await namespace(context).get(key)) ?? undefined
    },
    async put(key, value, context) {
      await namespace(context).put(key, value)
    },
    type: 'cloudflare',
  }
}

export declare namespace cloudflare {
  type Options = {
    /** Name of the KV namespace binding, such as `PAGES`. */
    binding: string
  }
}

/** Wraps a custom backend. */
export function from(options: from.Options): Storage {
  return { type: 'custom', ...options }
}

export declare namespace from {
  type Options = Pick<Storage, 'get' | 'put'> & Partial<Pick<Storage, 'type'>>
}

/**
 * Process memory. Values last as long as the process, and each Workers isolate has its own, so
 * use it only for development and tests.
 */
export function memory(): Storage {
  const values = new Map<string, string>()
  return {
    async get(key) {
      return values.get(key)
    },
    async put(key, value) {
      values.set(key, value)
    },
    type: 'memory',
  }
}

/** Thrown when `Storage.cloudflare` runs without its KV binding. */
export class MissingBindingError extends Error {
  override name = 'Storage.MissingBindingError'
  constructor(options: { binding: string }) {
    super(
      `Storage "cloudflare" has no KV binding "${options.binding}". Add a KV namespace with that binding to the Worker.`,
    )
  }
}
