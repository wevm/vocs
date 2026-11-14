/**
 * Renders the Mermaid diagrams of saved pages to SVG in the handler, so a permalink shows each
 * diagram without WebAssembly in the page. The `vocs()` plugin attaches the Ondine compiler module
 * to the config as a loader: a compiled module in Workers, and base64 bytes elsewhere.
 * @module
 */
import { create as createRenderer } from 'ondine/compiler/wasm'
import type * as Config from '../Config.js'

/** The config property that holds the loader of the compiler module. */
export const key = Symbol.for('vocs.diagram')

/** Loads the Ondine compiler module for every diagram type. */
export type Loader = () => Promise<WebAssembly.Module | string>

/** A diagram renderer. */
export type Svg = {
  /** Returns the SVG of a diagram. Throws Ondine's `RenderError` when the source is invalid. */
  render(source: string): Promise<string>
}

/** Returns the loader attached to a config, if the `vocs()` plugin attached one. */
export function loader(config: Config.Config): Loader | undefined {
  return (config as Config.Config & { [key]?: Loader | undefined })[key]
}

/** Creates a renderer that loads the compiler module on its first render. */
export function create(load: Loader): Svg {
  let renderer: Promise<ReturnType<typeof createRenderer>> | undefined
  return {
    async render(source) {
      renderer ??= load().then((all) => createRenderer({ modules: { all } }))
      return (await renderer).render(source).svg
    },
  }
}
