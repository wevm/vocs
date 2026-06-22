'use client'

import { config } from 'virtual:vocs/config'
import { useEffect, useState } from 'react'

/**
 * Lazily highlights code on the client.
 *
 * Twoslash hover popups embed a code snippet (the resolved type) for every
 * hoverable token. Highlighting these with Shiki on the server forces RSC to
 * render and serialize a fully highlighted snippet for every token across every
 * page at build time — which dominates build memory and time even though the
 * popups are only ever seen on hover.
 *
 * Instead we render the snippet as plain text in the RSC payload and highlight
 * it on the client. Because the popup only mounts when it opens, the Shiki
 * bundle is dynamically imported and the snippet highlighted on demand.
 */
export function CodeToHtml(props: CodeToHtml.Props) {
  const {
    anchorRanges,
    code,
    colorRanges,
    dimRanges,
    lang,
    lineAnchors,
    shrinkIndent = true,
  } = props
  const key = cacheKey(code, lang, shrinkIndent, dimRanges, lineAnchors, anchorRanges, colorRanges)
  // Track the highlighted HTML alongside the key it was computed for. Storing
  // the key lets us detect when `code`/`lang` change (e.g. switching the cURL /
  // JavaScript request sample tab) and resync — otherwise the component keeps
  // rendering the previously highlighted snippet.
  const [state, setState] = useState<{ key: string; html: string } | null>(() => {
    const cached = getCached(
      code,
      lang,
      shrinkIndent,
      dimRanges,
      lineAnchors,
      anchorRanges,
      colorRanges,
    )
    return cached ? { key, html: cached } : null
  })

  // When the snippet changes, resync from the cache during render so an already
  // highlighted snippet shows immediately without a plain-text flash.
  if (state && state.key !== key) {
    const cached = getCached(
      code,
      lang,
      shrinkIndent,
      dimRanges,
      lineAnchors,
      anchorRanges,
      colorRanges,
    )
    setState(cached ? { key, html: cached } : null)
  }

  const html = state?.key === key ? state.html : null

  useEffect(() => {
    if (html) return
    let cancelled = false
    highlight(code, lang, shrinkIndent, dimRanges, lineAnchors, anchorRanges, colorRanges)
      .then((result) => {
        if (!cancelled)
          setState({
            key: cacheKey(
              code,
              lang,
              shrinkIndent,
              dimRanges,
              lineAnchors,
              anchorRanges,
              colorRanges,
            ),
            html: result,
          })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [code, lang, shrinkIndent, dimRanges, lineAnchors, anchorRanges, colorRanges, html])

  if (html)
    // biome-ignore lint/security/noDangerouslySetInnerHtml: highlighted by Shiki
    return <div dangerouslySetInnerHTML={{ __html: html }} />

  // While highlighting, render a skeleton that mirrors the snippet's line
  // structure so the popup is shown immediately without a layout shift.
  return <Skeleton code={code} />
}

function Skeleton(props: { code: string }) {
  const lines = props.code.split('\n')
  return (
    <div data-v-code-skeleton aria-hidden="true">
      {/* `shiki` class mirrors the real highlighted markup so shared styles
          (e.g. code padding) apply identically and there is no layout shift. */}
      <pre className="shiki" data-v-overflow-fade>
        <code>
          {lines.map((line, index) => {
            const indent = line.length - line.trimStart().length
            const length = line.trim().length
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
              <span className="line" key={index}>
                {length > 0 && (
                  <span
                    data-v-skeleton-bar
                    style={{
                      marginLeft: `${indent}ch`,
                      width: `${Math.min(length, 48)}ch`,
                    }}
                  />
                )}
              </span>
            )
          })}
        </code>
        <div data-v-overflow-sentinel />
      </pre>
    </div>
  )
}

export namespace CodeToHtml {
  export type Props = {
    code: string
    lang: string
    /**
     * Whether to halve leading indentation (2 spaces → 1) for a more compact
     * code block. Defaults to `true`; set `false` to preserve the source's
     * indentation (e.g. for pretty-printed JSON response samples).
     */
    shrinkIndent?: boolean | undefined
    /**
     * `[start, end]` character ranges to visually dim (e.g. synthesized
     * placeholder values in a response example). Implemented via Shiki
     * decorations, so ranges must be non-overlapping and within bounds.
     */
    dimRanges?: [number, number][] | undefined
    /**
     * Per-line anchor ids. `lineAnchors[i]` (0-based) sets `data-anchor` on line
     * `i`'s element so the line can be made clickable (e.g. to jump from a
     * response example to the matching schema row).
     */
    lineAnchors?: (string | undefined)[] | undefined
    /**
     * Inline clickable spans: each `range` is a `[start, end]` character range
     * wrapped in a `data-anchor` span pointing at `id` (e.g. path/query params
     * in a request sample). Implemented via Shiki decorations, so ranges must be
     * non-overlapping and within bounds.
     */
    anchorRanges?: { range: [number, number]; id: string }[] | undefined
    /**
     * `[start, end]` character ranges to recolor with a semantic token color:
     * `'key'` uses the JSON-string color and `'value'` the JSON-number color (as
     * captured from the active Shiki theme). Used to make request-sample query
     * parameter names/values read like the JSON response example. Ranges must be
     * non-overlapping and within bounds.
     */
    colorRanges?: { range: [number, number]; kind: 'key' | 'value' }[] | undefined
  }
}

let highlighterPromise:
  | Promise<{
      codeToHtml: (
        code: string,
        lang: string,
        shrinkIndent: boolean,
        dimRanges?: [number, number][] | undefined,
        lineAnchors?: (string | undefined)[] | undefined,
        anchorRanges?: { range: [number, number]; id: string }[] | undefined,
        colorRanges?: { range: [number, number]; kind: 'key' | 'value' }[] | undefined,
      ) => Promise<string>
    }>
  | undefined

function getHighlighter() {
  if (!highlighterPromise)
    highlighterPromise = (async () => {
      const { bundledLanguages, createHighlighter, hastToHtml } = await import('shiki/bundle/web')
      const { codeHighlight } = config
      const { langAlias = {}, themes } = codeHighlight
      // Note: `langAlias` is intentionally not passed to the highlighter.
      // Passing a custom `langAlias` registers languages under their alias name
      // when lazily loaded (e.g. `loadLanguage('ts')` registers as `ts` instead
      // of `typescript`), which then makes `codeToHast({ lang })` fail to resolve
      // the grammar. We resolve aliases to their base language ourselves below.
      const highlighter = await createHighlighter({
        themes: Object.values(themes) as never,
        langs: [],
      })
      // Capture the active theme's JSON property-name/number colors once and
      // expose them as CSS variables, so request samples can recolor query/path
      // parameter names/values to match the JSON response example (openapi.css).
      void applyTokenColors(highlighter, themes)
      return {
        async codeToHtml(
          code: string,
          lang: string,
          shrinkIndent: boolean,
          dimRanges?: [number, number][] | undefined,
          lineAnchors?: (string | undefined)[] | undefined,
          anchorRanges?: { range: [number, number]; id: string }[] | undefined,
          colorRanges?: { range: [number, number]; kind: 'key' | 'value' }[] | undefined,
        ) {
          const base = langAlias[lang] ?? lang
          const resolvedLang = base in bundledLanguages ? base : 'txt'
          if (!highlighter.getLoadedLanguages().includes(resolvedLang))
            await highlighter.loadLanguage(resolvedLang as never)
          // Clamp/validate ranges so a bad offset can't throw inside Shiki.
          const decorations = [
            ...(dimRanges ?? [])
              .filter(([start, end]) => start >= 0 && end <= code.length && start < end)
              .map(([start, end]) => ({
                start,
                end,
                properties: { 'data-v-openapi-placeholder': '' },
              })),
            ...(anchorRanges ?? [])
              .filter(({ range: [start, end] }) => start >= 0 && end <= code.length && start < end)
              .map(({ range: [start, end], id }) => ({
                start,
                end,
                // Path parameter values are always values → color them blue.
                properties: {
                  'data-anchor': id,
                  'data-v-openapi-anchor': '',
                  'data-v-openapi-token': 'value',
                },
              })),
            ...(colorRanges ?? [])
              .filter(({ range: [start, end] }) => start >= 0 && end <= code.length && start < end)
              .map(({ range: [start, end], kind }) => ({
                start,
                end,
                properties: { 'data-v-openapi-token': kind },
              })),
          ]
          const hast = highlighter.codeToHast(code, {
            defaultColor: 'light-dark()',
            lang: resolvedLang,
            rootStyle: false,
            meta: { 'data-v-overflow-fade': true },
            themes,
            transformers: [
              ...(shrinkIndent ? [transformerShrinkIndent()] : []),
              ...(lineAnchors ? [transformerLineAnchors(lineAnchors)] : []),
            ],
            ...(decorations.length > 0 ? { decorations } : {}),
          })
          const pre = hast.children[0]
          if (pre && pre.type === 'element' && pre.tagName === 'pre')
            pre.children.push({
              type: 'element',
              tagName: 'div',
              properties: { 'data-v-overflow-sentinel': true },
              children: [],
            })
          return hastToHtml(hast)
        },
      }
    })()
  return highlighterPromise
}

const cache = new Map<string, string>()

function cacheKey(
  code: string,
  lang: string,
  shrinkIndent = true,
  dimRanges?: [number, number][] | undefined,
  lineAnchors?: (string | undefined)[] | undefined,
  anchorRanges?: { range: [number, number]; id: string }[] | undefined,
  colorRanges?: { range: [number, number]; kind: 'key' | 'value' }[] | undefined,
) {
  const ranges = dimRanges && dimRanges.length > 0 ? JSON.stringify(dimRanges) : ''
  const anchors = lineAnchors && lineAnchors.length > 0 ? JSON.stringify(lineAnchors) : ''
  const spans = anchorRanges && anchorRanges.length > 0 ? JSON.stringify(anchorRanges) : ''
  const colors = colorRanges && colorRanges.length > 0 ? JSON.stringify(colorRanges) : ''
  return `${lang}\n${shrinkIndent ? '1' : '0'}\n${ranges}\n${anchors}\n${spans}\n${colors}\n${code}`
}

/** Returns the highlighted HTML for a snippet if it has already been computed. */
export function getCached(
  code: string,
  lang: string,
  shrinkIndent = true,
  dimRanges?: [number, number][] | undefined,
  lineAnchors?: (string | undefined)[] | undefined,
  anchorRanges?: { range: [number, number]; id: string }[] | undefined,
  colorRanges?: { range: [number, number]; kind: 'key' | 'value' }[] | undefined,
) {
  return cache.get(
    cacheKey(code, lang, shrinkIndent, dimRanges, lineAnchors, anchorRanges, colorRanges),
  )
}

/** Highlights a snippet (memoized), loading the Shiki bundle on first use. */
export async function highlight(
  code: string,
  lang: string,
  shrinkIndent = true,
  dimRanges?: [number, number][] | undefined,
  lineAnchors?: (string | undefined)[] | undefined,
  anchorRanges?: { range: [number, number]; id: string }[] | undefined,
  colorRanges?: { range: [number, number]; kind: 'key' | 'value' }[] | undefined,
) {
  const key = cacheKey(code, lang, shrinkIndent, dimRanges, lineAnchors, anchorRanges, colorRanges)
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  const highlighter = await getHighlighter()
  const html = await highlighter.codeToHtml(
    code,
    lang,
    shrinkIndent,
    dimRanges,
    lineAnchors,
    anchorRanges,
    colorRanges,
  )
  cache.set(key, html)
  return html
}

/** Eagerly loads the Shiki bundle so the first real highlight is fast. */
export function prewarm() {
  void getHighlighter()
}

function transformerLineAnchors(lineAnchors: readonly (string | undefined)[]) {
  return {
    name: 'line-anchors',
    // Shiki's `line` hook is 1-based.
    line(hast: { properties?: Record<string, unknown> }, line: number) {
      const anchor = lineAnchors[line - 1]
      if (!anchor) return
      hast.properties ??= {}
      hast.properties['data-anchor'] = anchor
    },
  }
}

/**
 * Highlights a tiny probe JSON snippet to read the active theme's token colors,
 * then exposes them as CSS variables on `:root` so request samples can recolor
 * query/path parameter names/values to match the JSON response example: names
 * use the JSON property-name color (green in the default dark theme) and values
 * the JSON number color (blue). The captured values are `light-dark()` pairs, so
 * both color schemes match the response example. Runs once per highlighter;
 * failures are silent (CSS falls back to `--vocs-color-green`/`--vocs-color-blue`).
 */
async function applyTokenColors(
  highlighter: {
    getLoadedLanguages: () => string[]
    loadLanguage: (lang: never) => Promise<unknown>
    codeToHast: (code: string, options: never) => unknown
  },
  themes: Record<string, unknown>,
) {
  if (typeof document === 'undefined') return
  try {
    if (!highlighter.getLoadedLanguages().includes('json'))
      await highlighter.loadLanguage('json' as never)
    const hast = highlighter.codeToHast('{ "a": "abc", "b": 123 }', {
      defaultColor: 'light-dark()',
      lang: 'json',
      themes,
    } as never) as HastRoot
    // Names use the JSON property-name color (`"a"`); values the number color
    // (`123`). In the default dark theme these are green and blue respectively.
    const colors: { key?: string; value?: string } = {}
    walkHast(hast, (text, style) => {
      const color = style.match(/color:\s*([^;]+)/)?.[1]?.trim()
      if (!color) return
      if (text === '"a"') colors.key ??= color
      else if (text === '123') colors.value ??= color
    })
    const root = document.documentElement
    if (colors.key) root.style.setProperty('--vocs-openapi-token-key', colors.key)
    if (colors.value) root.style.setProperty('--vocs-openapi-token-value', colors.value)
  } catch {}
}

type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}
type HastRoot = { children?: HastNode[] }

/** Visits every text-bearing span in a hast tree with its text and inline style. */
function walkHast(node: HastNode | HastRoot, visit: (text: string, style: string) => void) {
  const children = (node as HastNode).children
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child.type === 'element' && child.tagName === 'span') {
        const text = child.children?.[0]?.value
        const style = child.properties?.['style']
        if (typeof text === 'string' && typeof style === 'string') visit(text, style)
      }
      walkHast(child, visit)
    }
  }
}

function transformerShrinkIndent() {
  return {
    name: 'indent',
    span(hast: { children: { type: string; value?: string }[] }) {
      const child = hast.children[0]
      if (!child) return
      if (child.type !== 'text') return
      if (!child.value) return
      hast.children[0] = { type: 'text', value: child.value.replace(/\s\s/g, ' ') }
    },
  }
}
