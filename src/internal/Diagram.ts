/**
 * Renders Mermaid source to SVG with Ondine. The compiler module loads on the first render, so a
 * page without diagrams downloads none of it. Invalid source throws Ondine's `RenderError`, with
 * the line, the column, and a snippet.
 * @module
 */
// oxlint-disable-next-line typescript/triple-slash-reference -- zile compiles only the entry graph, which an ambient declaration joins through a reference.
/// <reference path="./assets.d.ts" />
import { create as createRenderer } from 'ondine/compiler/wasm'
import url from 'ondine/compiler/wasm/all.wasm?url'

/** A Mermaid renderer. */
export type Diagram = {
  /** Returns the SVG of a diagram. Throws `RenderError` when the source is invalid. */
  render(source: string): Promise<string>
}

/** Creates a renderer that loads the compiler module on its first render. */
export function create(): Diagram {
  let renderer: Promise<ReturnType<typeof createRenderer>> | undefined
  return {
    async render(source) {
      renderer ??= WebAssembly.compileStreaming(fetch(url)).then((all) =>
        createRenderer({ modules: { all } }),
      )
      return (await renderer).render(source).svg
    },
  }
}
