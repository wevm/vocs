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
  const { code, lang } = props
  // Initialize from the cache so a snippet that was already highlighted (e.g.
  // pre-highlighted by the popover before opening, or shown previously) renders
  // highlighted immediately without a plain-text flash.
  const [html, setHtml] = useState<string | null>(() => getCached(code, lang) ?? null)

  useEffect(() => {
    if (html) return
    let cancelled = false
    highlight(code, lang)
      .then((result) => {
        if (!cancelled) setHtml(result)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [code, lang, html])

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
  }
}

let highlighterPromise:
  | Promise<{
      codeToHtml: (code: string, lang: string) => Promise<string>
    }>
  | undefined

function getHighlighter() {
  if (!highlighterPromise)
    highlighterPromise = (async () => {
      const [{ bundledLanguages, createHighlighter, hastToHtml }, { langs }] = await Promise.all([
        import('shiki/bundle/web'),
        import('virtual:vocs/langs'),
      ])
      const { codeHighlight } = config
      const { langAlias = {}, themes } = codeHighlight
      const extraLanguages = new Map(
        langs.flatMap((lang) => [lang.name, ...(lang.aliases ?? [])].map((name) => [name, lang])),
      )
      // Note: `langAlias` is intentionally not passed to the highlighter.
      // Passing a custom `langAlias` registers languages under their alias name
      // when lazily loaded (e.g. `loadLanguage('ts')` registers as `ts` instead
      // of `typescript`), which then makes `codeToHast({ lang })` fail to resolve
      // the grammar. We resolve aliases to their base language ourselves below.
      const highlighter = await createHighlighter({
        themes: Object.values(themes) as never,
        langs: [],
      })
      return {
        async codeToHtml(code: string, lang: string) {
          const base = langAlias[lang] ?? lang
          const extraLanguage = extraLanguages.get(base)
          const resolvedLang = base in bundledLanguages ? base : (extraLanguage?.name ?? 'txt')
          if (!highlighter.getLoadedLanguages().includes(resolvedLang)) {
            if (extraLanguage) await highlighter.loadLanguage(extraLanguage)
            else await highlighter.loadLanguage(resolvedLang as never)
          }
          const hast = highlighter.codeToHast(code, {
            defaultColor: 'light-dark()',
            lang: resolvedLang,
            rootStyle: false,
            meta: { 'data-v-overflow-fade': true },
            themes,
            transformers: [transformerShrinkIndent()],
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

function cacheKey(code: string, lang: string) {
  return `${lang}\n${code}`
}

/** Returns the highlighted HTML for a snippet if it has already been computed. */
export function getCached(code: string, lang: string) {
  return cache.get(cacheKey(code, lang))
}

/** Highlights a snippet (memoized), loading the Shiki bundle on first use. */
export async function highlight(code: string, lang: string) {
  const key = cacheKey(code, lang)
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  const highlighter = await getHighlighter()
  const html = await highlighter.codeToHtml(code, lang)
  cache.set(key, html)
  return html
}

/** Eagerly loads the Shiki bundle so the first real highlight is fast. */
export function prewarm() {
  void getHighlighter()
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
