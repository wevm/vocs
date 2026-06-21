import type { Payload } from '../../internal/openapi/app.js'
import { type Assets, assetRoot } from './assets.js'

/**
 * Renders the prebuilt app's HTML shell: the real Vocs `<html data-vocs>` root
 * (so the design system + theming apply), a pre-paint theme bootstrap, the
 * embedded JSON payload, and references to the prebuilt browser bundle.
 *
 * Assets are referenced with absolute URLs prefixed by the inferred `mount`, so
 * they route back to the handler regardless of where it is mounted (and
 * independent of a trailing slash on the current URL).
 */
export function render(payload: Payload, assets: Assets, mount: string): string {
  const base = `${mount === '/' ? '' : mount}${assetRoot}`
  const styles = assets.styles
    .map((href) => `<link rel="stylesheet" href="${base}${href}">`)
    .join('\n    ')
  const data = escapeJson(payload)

  const colorScheme = (payload.config?.colorScheme as string | undefined) ?? 'light dark'
  const accentColor =
    (payload.config?.accentColor as string | undefined) ?? 'light-dark(black, white)'
  const staticTheme = colorScheme === 'light' || colorScheme === 'dark' ? colorScheme : undefined

  return `<!doctype html>
<html data-vocs lang="en"${staticTheme ? ` data-vocs-theme="${staticTheme}"` : ''} style="color-scheme: ${escapeAttr(colorScheme)}; --vocs-color-accent: ${escapeAttr(accentColor)}" suppressHydrationWarning>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(payload.title)}</title>
    <script>${themeBootstrap(colorScheme)}</script>
    ${styles}
  </head>
  <body data-version="1.0">
    <script id="vocs-openapi-data" type="application/json">${data}</script>
    <script type="module" src="${base}${assets.entry}"></script>
  </body>
</html>`
}

/**
 * Applies the persisted (`localStorage.vocs-theme`) or system color scheme to
 * `<html data-vocs-theme>` / `colorScheme` before first paint (matching
 * {@link file://../../react/Root.client.tsx Root_client}).
 */
function themeBootstrap(colorScheme: string): string {
  return `(function(){try{var s=${JSON.stringify(colorScheme)};var e=document.documentElement;var t;if(s==='light'||s==='dark')t=s;else{t=localStorage.getItem('vocs-theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}e.setAttribute('data-vocs-theme',t);e.style.colorScheme=t;}catch(_){}})()`
}

/** Escapes a value for safe embedding inside a `<script>` JSON block. */
function escapeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** Escapes text for safe embedding in HTML element content. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Escapes a value for safe embedding inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
