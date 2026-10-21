// @vitest-environment jsdom
import type { TwoslashShikiReturn } from '@shikijs/twoslash'
import { createHighlighter, hastToHtml } from 'shiki'
import { describe, expect, it, vi } from 'vitest'
import * as Highlights from './highlights.js'
import * as Transformers from './shiki-transformers.js'

const themes = { light: 'github-light', dark: 'github-dark-dimmed' } as const

function semantics(html: string) {
  const doc = document.implementation.createHTMLDocument()
  doc.body.innerHTML = html
  return {
    text: doc.querySelector('code')?.textContent,
    popups: Array.from(doc.querySelectorAll('[data-v-code]')).map((node) => ({
      code: node.getAttribute('data-v-code'),
      lang: node.getAttribute('data-v-lang'),
    })),
    annotations: Array.from(
      doc.querySelectorAll(
        '.twoslash-hover, .twoslash-error, .twoslash-completion-cursor, .twoslash-completions, .twoslash-query-persisted',
      ),
    ).map((node) => ({
      classes: node.className,
      text: node.textContent,
    })),
  }
}

describe('Highlights Twoslash bridge', () => {
  it.each([
    [
      'Unicode, hidden lines, queries, and CRLF',
      'const hidden = 1\r\n// ---cut---\r\nconst greeting = "👋 café"\r\ngreeting\r\n// ^?',
    ],
    ['expected errors', '// @errors: 2322\nconst count: string = 1'],
    ['completions', '// @errors: 2339\nconst object = { alpha: 1, beta: 2 }\nobject.a\n//      ^|'],
    [
      'TSX filename override',
      '// @errors: 7026 2874\n// @filename: example.tsx\nconst element = <div />',
    ],
  ])('preserves Shiki semantics for %s, including cached analysis', async (_name, code) => {
    const shiki = await createHighlighter({ themes: Object.values(themes), langs: ['ts', 'tsx'] })
    const empty = await createHighlighter({ themes: Object.values(themes), langs: [] })
    const fallback = vi.spyOn(empty, 'codeToTokens')
    const highlighter = Highlights.from(empty)
    const cache = new Map<string, TwoslashShikiReturn>()
    const write = vi.fn((code: string, data: TwoslashShikiReturn) => {
      cache.set(code, data)
    })
    const render = (engine: typeof shiki) =>
      hastToHtml(
        engine.codeToHast(code, {
          lang: 'ts',
          themes,
          defaultColor: 'light-dark()',
          rootStyle: false,
          meta: { __raw: 'twoslash' },
          transformers: [
            Transformers.twoslash({
              typesCache: { read: (code) => cache.get(code) ?? null, write },
            }),
          ],
        }),
      )
    Transformers.twoslashErrors.length = 0
    const expected = semantics(render(shiki))
    expect(Transformers.twoslashErrors).toEqual([])
    expect(write).toHaveBeenCalledTimes(1)
    const actual = render(highlighter)
    expect(semantics(actual)).toEqual(expected)
    expect(write).toHaveBeenCalledTimes(1)
    expect(Transformers.twoslashErrors).toEqual([])
    expect(fallback).not.toHaveBeenCalled()
    expect(empty.getLoadedLanguages()).toEqual([])
    expect(actual).toContain('twoslash lsp')
    if (_name === 'expected errors') expect(actual).toContain('twoslash-error')
    if (_name === 'completions') expect(actual).toContain('twoslash-completions')
    if (_name.startsWith('Unicode')) {
      expect(actual).not.toContain('hidden')
      expect(expected.popups.some((popup) => popup.code?.includes('greeting'))).toBe(true)
    }
    shiki.dispose()
    empty.dispose()
  })
})
