/**
 * The demo registry that the `vocs()` plugin attaches to the config it serves. The handler reads
 * it to render the demos of a permalink on the server, and to link the module that hydrates them.
 * @module
 */
import type * as React from 'react'
import type * as Config from '../Config.js'

/** The config property that holds the registry. */
export const key = Symbol.for('vocs.demos')

/** Demos of a built config. */
export type Registry = {
  /** Imports the module loaders by demo name. */
  load(): Promise<
    Record<string, () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>>
  >
  /** URLs of the modules that `script` imports, which a permalink preloads beside it. */
  preload: readonly string[]
  /** URL of the module that hydrates the demos of a permalink, a static asset of the host's build. */
  script: string
}

/** Returns the registry attached to a config, if it registers demos. */
export function registry(config: Config.Config): Registry | undefined {
  return (config as Config.Config & { [key]?: Registry | undefined })[key]
}
