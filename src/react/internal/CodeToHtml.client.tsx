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
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    highlight(code, lang)
      .then((result) => {
        if (!cancelled) setHtml(result)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [code, lang])

  if (html)
    // biome-ignore lint/security/noDangerouslySetInnerHtml: highlighted by Shiki
    return <div dangerouslySetInnerHTML={{ __html: html }} />

  return (
    <div>
      <pre data-v-overflow-fade>
        <code>{code}</code>
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
      return {
        async codeToHtml(code: string, lang: string) {
          const base = langAlias[lang] ?? lang
          const resolvedLang = base in bundledLanguages ? base : 'txt'
          if (!highlighter.getLoadedLanguages().includes(resolvedLang))
            await highlighter.loadLanguage(resolvedLang as never)
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

async function highlight(code: string, lang: string) {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, lang)
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
