/**
 * Types of the modules the `vocs()` plugin serves. Reference them with
 * `/// <reference types="vocs/vite/virtual" />`.
 * @module
 */
declare module 'virtual:vocs/config' {
  const config: import('vocs').Config.Config
  export default config
}

/** The components of the config's `demos`, by name. Each loads on its first render. */
declare module 'virtual:vocs/demos' {
  const demos: Record<string, import('react').JSXElementConstructor<never>>
  export default demos
}
