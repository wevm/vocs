/**
 * Types the asset URL imports of WebAssembly modules, which Vite resolves in the host app.
 * @module
 */
declare module 'nanocode-ts/nanocode_wasm.wasm?url' {
  const url: string
  export default url
}

declare module 'ondine/compiler/wasm/all.wasm?url' {
  const url: string
  export default url
}
