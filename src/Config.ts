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
  /**
   * Interactive components that `demo` blocks may name, by name. The agent sees the names and
   * the props schemas, the reader's page imports the components from `virtual:vocs/demos`, and
   * permalinks render them on the server and hydrate them in the browser.
   */
  demos?: Record<string, Demo> | undefined
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
 * A demo: the path of its module, relative to the config file, or the path and a schema of its
 * props. The module default-exports a React component. Without `props`, the component takes no
 * props.
 *
 * @example
 * ```ts
 * import * as z from 'zod'
 *
 * const demos = {
 *   balance: './src/demos/Balance.tsx',
 *   memo: { module: './src/demos/Memo.tsx', props: z.object({ memo: z.string().max(32) }) },
 * }
 * ```
 */
export type Demo = string | { module: string; props: Schema }

/**
 * A Standard Schema that also converts to JSON Schema, such as a zod 4 schema. The handler
 * validates demo props with it, and the agent reads its JSON Schema.
 */
export type Schema = {
  readonly '~standard': {
    readonly jsonSchema: {
      readonly input: (options: { readonly target: 'draft-2020-12' }) => Record<string, unknown>
    }
    readonly validate: (value: unknown) => Schema.Result | Promise<Schema.Result>
  }
}

export declare namespace Schema {
  /** The value with defaults applied, or the issues that reject it. */
  type Result =
    | { readonly issues?: undefined; readonly value: unknown }
    | {
        readonly issues: readonly {
          readonly message: string
          readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[] | undefined
        }[]
      }
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
 * @throws {Config.InvalidError} When a field is missing, two sources share a name, or a demo name is invalid.
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

  for (const [name, demo] of Object.entries(config.demos ?? {})) {
    if (!/^[a-z][a-z0-9-]*$/.test(name))
      throw new InvalidError(
        `Demo name "${name}" is invalid. Use lowercase letters, digits, and hyphens.`,
      )
    const path = typeof demo === 'string' ? demo : demo?.module
    if (typeof path !== 'string' || !path.trim())
      throw new InvalidError(
        `\`demos.${name}\` has no module path. Set it to a path such as "./src/demos/Memo.tsx".`,
      )
    if (
      typeof demo !== 'string' &&
      typeof demo.props?.['~standard']?.jsonSchema?.input !== 'function'
    )
      throw new InvalidError(
        `\`demos.${name}.props\` does not convert to JSON Schema. Use a schema that implements Standard JSON Schema, such as a zod 4 schema.`,
      )
  }

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
