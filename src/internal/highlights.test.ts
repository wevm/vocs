import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import * as Shiki from 'shiki'
import { createHighlighter, hastToHtml } from 'shiki'
import { unified } from 'unified'
import { describe, expect, it, vi } from 'vitest'
import * as Highlights from './highlights.js'
import { rehypeShiki } from './mdx.js'

vi.mock('shiki', async (original) => {
  const actual = await original<typeof import('shiki')>()
  return { ...actual, getSingletonHighlighter: vi.fn(actual.getSingletonHighlighter) }
})

const themes = { light: 'github-light', dark: 'github-dark-dimmed' } as const

async function highlight(markdown: string, options: Partial<rehypeShiki.Options> = {}) {
  const [plugin, resolved] = rehypeShiki({
    themes,
    engine: 'highlights',
    twoslash: false,
    ...options,
  })
  return String(
    await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(plugin, resolved)
      .use(rehypeStringify)
      .process(markdown),
  )
}

describe('Highlights', () => {
  it('retains Vocs annotations, titles, themes, and line numbers', async () => {
    const html = await highlight(
      '```ts [example.ts]\n// [!code line-numbers]\nconst first = 1 // [!code ++]\nconst second = 2 // [!code focus]\nconst third = 3 // [!code hl]\n```',
    )
    expect(html).toMatchInlineSnapshot(`
      "<pre class="shiki shiki-themes github-light github-dark-dimmed has-diff has-focused has-highlighted" tabindex="0" data-title="example.ts" data-v-lang="ts"><code class="line-numbers" data-language="ts"><span class="line diff add"><span style="color:light-dark(#d73a49, #f47067)">const </span><span style="color:light-dark(#24292e, #d1d7e0)">first </span><span style="color:light-dark(#d73a49, #f47067)">= </span><span style="color:light-dark(#005cc5, #6cb6ff)">1 </span></span>
      <span class="line focused"><span style="color:light-dark(#d73a49, #f47067)">const </span><span style="color:light-dark(#24292e, #d1d7e0)">second </span><span style="color:light-dark(#d73a49, #f47067)">= </span><span style="color:light-dark(#005cc5, #6cb6ff)">2 </span></span>
      <span class="line highlighted"><span style="color:light-dark(#d73a49, #f47067)">const </span><span style="color:light-dark(#24292e, #d1d7e0)">third </span><span style="color:light-dark(#d73a49, #f47067)">= </span><span style="color:light-dark(#005cc5, #6cb6ff)">3 </span></span></code></pre>"
    `)
    expect(html).toContain('light-dark(')
    expect(html).toContain('diff add')
    expect(html).toContain('focused')
    expect(html).toContain('highlighted')
    expect(html).not.toContain('[!code')
  })

  it('supports inline code and aliases', async () => {
    const html = await highlight('`const x = 1{:example}`', {
      langAlias: { example: 'typescript' },
    })
    expect(html).toContain('color:light-dark(')
    expect(html).toMatchInlineSnapshot(
      `"<p><span class="shiki shiki-themes github-light github-dark-dimmed" tabindex="0"><code data-language="typescript"><span class="line"><span style="color:light-dark(#d73a49, #f47067)">const </span><span style="color:light-dark(#24292e, #d1d7e0)">x </span><span style="color:light-dark(#d73a49, #f47067)">= </span><span style="color:light-dark(#005cc5, #6cb6ff)">1</span></span></code></span></p>"`,
    )
  })

  it('preserves Unicode, CRLF, blank lines, and escaped HTML', async () => {
    const shiki = await createHighlighter({ themes: Object.values(themes), langs: ['ts'] })
    const highlighter = Highlights.from(shiki)
    const source = 'const greeting = "👋 café <script>"\r\n\r\n// 你好\r\n'
    const tree = highlighter.codeToHast(source, {
      lang: 'ts',
      themes,
      defaultColor: 'light-dark()',
      rootStyle: false,
    })
    expect(hastToHtml(tree)).toMatchInlineSnapshot(`
      "<pre class="shiki shiki-themes github-light github-dark-dimmed" tabindex="0"><code><span class="line"><span style="color:light-dark(#d73a49, #f47067)">const </span><span style="color:light-dark(#24292e, #d1d7e0)">greeting </span><span style="color:light-dark(#d73a49, #f47067)">= </span><span style="color:light-dark(#032f62, #96d0ff)">"👋 café &#x3C;script>"</span></span>
      <span class="line"></span>
      <span class="line"><span style="color:light-dark(#6a737d, #9198a1)">// 你好</span></span>
      <span class="line"></span></code></pre>"
    `)
    shiki.dispose()
  })

  it('uses Highlights for supported blocks and Shiki for compatibility fallbacks', async () => {
    const shiki = await createHighlighter({ themes: Object.values(themes), langs: ['ts', 'cue'] })
    const original = shiki.codeToHast
    const fallback = vi.spyOn(shiki, 'codeToHast')
    const highlighter = Highlights.from(shiki, { customLanguages: ['typescript'] })
    const options = { lang: 'ts', themes } as const
    highlighter.codeToHast('const x = 1', options)
    expect(fallback).not.toHaveBeenCalled()
    const cases = [
      { ...options, lang: 'cue' as const },
      { ...options, lang: 'text' as const },
      { ...options, lang: 'typescript' as const },
      { ...options, themes: { light: { name: 'custom', settings: [] } } },
    ]
    for (const options of cases) {
      const code = 'const x = 1'
      expect(highlighter.codeToHast(code, options)).toEqual(original(code, options))
    }
    expect(fallback).toHaveBeenCalledTimes(cases.length)
    shiki.dispose()
  })

  it('decorates UTF-16 ranges inside tokens and across CRLF lines without Shiki tokenization', async () => {
    const shiki = await createHighlighter({ themes: Object.values(themes), langs: [] })
    const fallback = vi.spyOn(shiki, 'codeToHast')
    const highlighter = Highlights.from(shiki)
    const source = 'const value = "👋 café"\r\nconsole.log(value)'
    const options = {
      lang: 'ts',
      themes,
      defaultColor: 'light-dark()',
      rootStyle: false,
      decorations: [
        {
          start: source.indexOf('café'),
          end: source.indexOf('café') + 4,
          properties: { 'data-anchor': 'cafe' },
        },
        {
          start: { line: 0, character: source.indexOf('👋') },
          end: { line: 1, character: 7 },
          properties: { 'data-dim': 'yes' },
          alwaysWrap: true,
        },
      ],
    } as const
    const html = hastToHtml(
      highlighter.codeToHast(source, { ...options, decorations: [...options.decorations] }),
    )
    expect(fallback).not.toHaveBeenCalled()
    expect(html).toMatchInlineSnapshot(`
      "<pre class="shiki shiki-themes github-light github-dark-dimmed" tabindex="0"><code><span class="line"><span style="color:light-dark(#d73a49, #f47067)">const </span><span style="color:light-dark(#24292e, #d1d7e0)">value </span><span style="color:light-dark(#d73a49, #f47067)">= </span><span style="color:light-dark(#032f62, #96d0ff)">"</span><span data-dim="yes"><span style="color:light-dark(#032f62, #96d0ff)">👋 </span><span style="color:light-dark(#032f62, #96d0ff)" data-anchor="cafe">café</span><span style="color:light-dark(#032f62, #96d0ff)">"</span></span></span>
      <span class="line"><span data-dim="yes"><span style="color:light-dark(#24292e, #d1d7e0)">console</span></span><span style="color:light-dark(#d73a49, #d1d7e0)">.</span><span style="color:light-dark(#6f42c1, #dcbdfb)">log</span><span style="color:light-dark(#005cc5, #d1d7e0)">(</span><span style="color:light-dark(#24292e, #d1d7e0)">value</span><span style="color:light-dark(#005cc5, #d1d7e0)">)</span></span></code></pre>"
    `)
    expect(() =>
      highlighter.codeToHast(source, {
        lang: 'ts',
        themes,
        decorations: [{ start: -1, end: 2 }],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ShikiError: Invalid decoration offset: -1. Code length: 43]`,
    )
    shiki.dispose()
  })

  it('keeps lazy language loading and unknown-language fallback', async () => {
    expect(
      await highlight('```astro\n<div>Hello</div>\n```\n\n```unknown\n<script>\n```'),
    ).toMatchInlineSnapshot(`
      "<pre class="shiki shiki-themes github-light github-dark-dimmed" tabindex="0"><code data-language="astro"><span class="line"><span style="color:light-dark(#005cc5, #d1d7e0)">&#x3C;</span><span style="color:light-dark(#22863a, #8ddb8c)">div</span><span style="color:light-dark(#005cc5, #d1d7e0)">></span><span style="color:light-dark(#24292e, #d1d7e0)">Hello</span><span style="color:light-dark(#005cc5, #d1d7e0)">&#x3C;/</span><span style="color:light-dark(#22863a, #8ddb8c)">div</span><span style="color:light-dark(#005cc5, #d1d7e0)">></span></span></code></pre>
      <pre class="shiki shiki-themes github-light github-dark-dimmed" tabindex="0"><code><span class="line"><span>&#x3C;script></span></span></code></pre>"
    `)
  })

  it('loads grammars only for compatibility fallbacks, including lazy aliases', async () => {
    const shiki = await createHighlighter({ themes: Object.values(themes), langs: [] })
    const highlighter = Highlights.from(shiki, {
      codeOptions: { themes },
      langAlias: { example: 'typescript' },
    })
    await highlighter.loadLanguage('ts', 'json', 'example' as never)
    expect(shiki.getLoadedLanguages()).toEqual([])
    expect(
      hastToHtml(highlighter.codeToHast('const x = 1', { lang: 'example', themes })),
    ).toContain('const ')
    await highlighter.loadLanguage('cue')
    expect(shiki.getLoadedLanguages()).toContain('cue')
    expect(highlighter.codeToHast('x: 1', { lang: 'cue', themes })).toEqual(
      shiki.codeToHast('x: 1', { lang: 'cue', themes }),
    )
    shiki.dispose()
  })

  it('skips configured supported grammars in the MDX plugin but loads unsupported ones', async () => {
    const create = vi.mocked(Shiki.getSingletonHighlighter)
    create.mockClear()
    try {
      await highlight('```ts\nconst x = 1\n```\n\n```cue\nx: 1\n```', {
        langs: ['ts', 'json', 'cue'],
        langAlias: { example: 'typescript' },
      })
      expect(create.mock.lastCall?.[0]?.langs).toEqual(['cue'])
    } finally {
      create.mockClear()
    }
  })

  it('loads supported grammars when advanced options or custom themes require fallback', async () => {
    const customTheme = { name: 'custom', settings: [] }
    const shiki = await createHighlighter({
      themes: [customTheme, ...Object.values(themes)],
      langs: [],
    })
    for (const codeOptions of [
      { themes, includeExplanation: true },
      { themes: { light: customTheme } },
    ]) {
      const highlighter = Highlights.from(shiki, { codeOptions })
      await highlighter.loadLanguage('ts')
      const options = { ...codeOptions, lang: 'ts' }
      expect(highlighter.codeToHast('const x = 1', options)).toEqual(
        shiki.codeToHast('const x = 1', options),
      )
    }
    expect(shiki.getLoadedLanguages()).toContain('typescript')
    shiki.dispose()
  })

  it('renders Twoslash through the MDX plugin with lazy alias loading', async () => {
    const html = await highlight('```example twoslash\nconst value = 42\nvalue\n// ^?\n```', {
      langs: [],
      langAlias: { example: 'typescript' },
      twoslash: { typesCache: { read: () => null, write: () => {} } },
    })
    expect(html).toContain('twoslash lsp')
    expect(html).toContain('data-v-code="const value: 42"')
    expect(html).not.toContain('// ^?')
  })

  it('tokenizes the language selected by preprocess hooks', () => {
    const code = '<div>Hello</div>'
    const expected = Highlights.render(code, { lang: 'tsx', themes })
    const actual = Highlights.render('placeholder', {
      lang: 'ts',
      themes,
      transformers: [
        {
          preprocess() {
            this.options.lang = 'tsx'
            return code
          },
        },
      ],
    })
    expect(actual).toEqual(expected)
  })

  it('retains grammar loading for user hooks requesting grammar-dependent tokens', async () => {
    let calls = 0
    await highlight('```ts\nconst value = 1\n```', {
      langs: [],
      transformers: [
        {
          preprocess(code) {
            const result = this.codeToTokens(code, { lang: 'ts', themes, includeExplanation: true })
            expect(result.tokens.flat().some((token) => token.explanation?.length)).toBe(true)
            calls++
          },
        },
      ],
    })
    expect(calls).toBe(1)
  })

  it('runs ordered preprocess, token, and HAST hooks with shared context', async () => {
    const calls: string[] = []
    const html = await highlight('```ts\nconst x = 1\n```', {
      transformers: [
        {
          name: 'test',
          preprocess(code) {
            calls.push('preprocess')
            Object.assign(this.meta, { test: true })
            return code.replace('1', '2')
          },
          tokens(tokens) {
            calls.push('tokens')
            expect(this.source).toBe('const x = 2')
            expect(this.meta).toEqual({ test: true })
            return tokens
          },
          pre(node) {
            calls.push('pre')
            node.properties['data-test'] = 'yes'
          },
        },
      ],
    })
    expect(calls).toEqual(['preprocess', 'tokens', 'pre'])
    expect(html).toContain('data-test="yes"')
    expect(html).toContain('>2</span>')
  })
})
