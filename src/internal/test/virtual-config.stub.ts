/**
 * Runtime stub for the `virtual:vocs/config` module used in unit tests.
 *
 * The real module is provided by a Vite plugin at dev/build time, so it does not
 * exist under vitest. Components that import it (e.g. `CodeToHtml`) only read
 * `config` inside lazy, effect-driven code paths that never run during static
 * rendering, so this minimal shape is enough to let those modules import.
 */
export const config = {
  codeHighlight: {
    langAlias: {},
    themes: { light: 'github-light', dark: 'github-dark-dimmed' },
  },
}
