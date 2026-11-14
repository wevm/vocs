/**
 * Site configuration. `defineConfig` validates a config and returns it with its types, so a
 * mistake fails when the config loads instead of when a reader asks a question.
 * @module
 */
import type * as Provider from './Provider.js'
import type * as Source from './Source.js'
import type * as Storage from './Storage.js'

/** A Vocs site. */
export type Config = {
  /** One-sentence description, used in metadata and agent instructions. */
  description?: string | undefined
  /** The LLM provider the handler forwards the agent's model requests to. */
  provider: Provider.Provider
  /** Content the agent reads. */
  sources: readonly Source.Source[]
  /** Where saved pages go. Without it, readers cannot keep a page. */
  storage?: Storage.Storage | undefined
  /** Site title. */
  title: string
  /**
   * Turns on Twoslash for `ts` and `tsx` code blocks: the render route type-checks each block
   * that sets `twoslash`, returns type errors to the agent, and shows types on hover. The build
   * reads the types of `packages` from the host's `node_modules`.
   */
  twoslash?: { packages: readonly string[] } | undefined
}

/**
 * Validates a config and returns it.
 *
 * @example
 * ```ts
 * import { defineConfig, Provider, Source } from 'vocs'
 *
 * export default defineConfig({
 *   provider: Provider.cloudflare({ gateway: 'docs', models: ['gpt-6-luna'] }),
 *   sources: [Source.files({ include: 'docs/**\/*.md' })],
 *   title: 'Tempo',
 * })
 * ```
 *
 * @throws {Config.InvalidError} When a field is missing or two sources share a name.
 */
export function defineConfig<const config extends Config>(config: config): config {
  if (typeof config.title !== 'string' || !config.title.trim())
    throw new InvalidError('`title` is empty. Set it to the site name.')
  if (!config.provider || typeof config.provider.complete !== 'function')
    throw new InvalidError(
      '`provider` is missing. Set it with `Provider.cloudflare(...)` or `Provider.from(...)`.',
    )
  if (config.provider.models.length === 0)
    throw new InvalidError('`provider.models` is empty. List the model IDs the handler forwards.')
  if (!Array.isArray(config.sources) || config.sources.length === 0)
    throw new InvalidError(
      '`sources` is empty. Add at least one source, such as `Source.files(...)`.',
    )

  if (config.twoslash && !Array.isArray(config.twoslash.packages))
    throw new InvalidError(
      '`twoslash.packages` is missing. List the packages that code blocks import, such as `["viem"]`.',
    )

  const names = new Set<string>()
  for (const source of config.sources) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(source.name))
      throw new InvalidError(
        `Source name "${source.name}" is invalid. Use lowercase letters, digits, and hyphens.`,
      )
    if (names.has(source.name))
      throw new InvalidError(
        `Two sources are named "${source.name}". Set a unique \`name\` on one of them.`,
      )
    names.add(source.name)
  }

  return config
}

/** Thrown when a config is invalid. */
export class InvalidError extends Error {
  override name = 'Config.InvalidError'
}
