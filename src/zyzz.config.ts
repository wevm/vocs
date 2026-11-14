/**
 * The zyzz tokens and layer of the default theme, a monochrome one. Every token reads a public `--vocs-*` custom
 * property and falls back to the default value, with dark values under `prefers-color-scheme`, so hosts restyle Vocs by setting `--vocs-*`
 * properties with no zyzz setup. Every style sits in the `vocs` cascade layer, so unlayered host
 * CSS wins. `pnpm build` compiles the styles to `vocs/styles.css`, and the fallbacks to
 * `vocs/tokens.css`.
 * @module
 */
import { type Config, defineConfig } from 'zyzz'

export const { style, vars } = defineConfig({
  id: 'vocs',
  layers: ['vocs'],
  vars: {
    color: {
      accent: {
        default: 'var(--vocs-color-accent, #222222)',
        '@media (prefers-color-scheme: dark)': 'var(--vocs-color-accent, #dadada)',
      },
      background: {
        default: 'var(--vocs-color-background, #ffffff)',
        '@media (prefers-color-scheme: dark)': 'var(--vocs-color-background, #1e1e1e)',
      },
      border: {
        default: 'var(--vocs-color-border, #e3e3e3)',
        '@media (prefers-color-scheme: dark)': 'var(--vocs-color-border, #363636)',
      },
      foreground: {
        default: 'var(--vocs-color-foreground, #222222)',
        '@media (prefers-color-scheme: dark)': 'var(--vocs-color-foreground, #dadada)',
      },
      muted: {
        default: 'var(--vocs-color-muted, #777777)',
        '@media (prefers-color-scheme: dark)': 'var(--vocs-color-muted, #999999)',
      },
      surface: {
        default: 'var(--vocs-color-surface, #f6f6f6)',
        '@media (prefers-color-scheme: dark)': 'var(--vocs-color-surface, #262626)',
      },
      transparent: 'transparent',
    },
    fontFamily: {
      mono: 'var(--vocs-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
      sans: 'var(--vocs-font-sans, ui-sans-serif, system-ui, sans-serif)',
    },
    fontSize: {
      lg: 'var(--vocs-font-size-lg, 1.125rem)',
      md: 'var(--vocs-font-size-md, 1rem)',
      sm: 'var(--vocs-font-size-sm, 0.875rem)',
      xl: 'var(--vocs-font-size-xl, 1.5rem)',
      xs: 'var(--vocs-font-size-xs, 0.8125rem)',
    },
    radius: {
      full: 'var(--vocs-radius-full, 9999px)',
      lg: 'var(--vocs-radius-lg, 10px)',
      md: 'var(--vocs-radius-md, 6px)',
      sm: 'var(--vocs-radius-sm, 3px)',
    },
    shadow: {
      md: 'var(--vocs-shadow-md, 0 1px 3px rgb(0 0 0 / 0.06))',
    },
    spacing: {
      0: '0px',
      1: 'var(--vocs-spacing-1, 0.25rem)',
      2: 'var(--vocs-spacing-2, 0.5rem)',
      3: 'var(--vocs-spacing-3, 0.75rem)',
      4: 'var(--vocs-spacing-4, 1rem)',
      6: 'var(--vocs-spacing-6, 1.5rem)',
      8: 'var(--vocs-spacing-8, 2rem)',
      12: 'var(--vocs-spacing-12, 3rem)',
      16: 'var(--vocs-spacing-16, 4rem)',
      auto: 'auto',
      full: '100%',
      page: 'var(--vocs-spacing-page, 42rem)',
      sidebar: 'var(--vocs-spacing-sidebar, 15rem)',
    },
  },
})

/**
 * The helpers' type, written out so declaration emit can name zyzz's types through this
 * module's import of `Config`.
 */
export type Helpers = Config.create.ReturnType
