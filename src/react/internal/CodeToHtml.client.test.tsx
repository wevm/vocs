// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const setup = vi.hoisted(() => ({
  config: {
    codeHighlight: {
      engine: 'highlights',
      langAlias: { example: 'typescript' },
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    },
  },
  langs: [] as import('shiki').LanguageRegistration[],
  highlighters: [] as Awaited<ReturnType<typeof import('shiki/bundle/web').createHighlighter>>[],
}))
vi.mock('virtual:vocs/langs', () => ({ langs: setup.langs }))
vi.mock('virtual:vocs/config', () => ({ config: setup.config }))
vi.mock('shiki/bundle/web', async (original) => {
  const actual = await original<typeof import('shiki/bundle/web')>()
  return {
    ...actual,
    createHighlighter: vi.fn(async (options) => {
      const highlighter = await actual.createHighlighter(options)
      setup.highlighters.push(highlighter)
      vi.spyOn(highlighter, 'codeToHast')
      vi.spyOn(highlighter, 'codeToTokens')
      return highlighter
    }),
  }
})

beforeEach(() => {
  vi.resetModules()
  setup.langs.length = 0
  setup.config.codeHighlight.engine = 'highlights'
  setup.config.codeHighlight.themes = { light: 'github-light', dark: 'github-dark-dimmed' }
  document.documentElement.removeAttribute('style')
})
afterEach(() => {
  for (const highlighter of setup.highlighters.splice(0)) highlighter.dispose()
})

describe('client highlighting', () => {
  it('uses Highlights for aliases and hover snippets without loading TextMate grammars', async () => {
    const { highlight, getCached } = await import('./CodeToHtml.client.js')
    const code = 'const greeting = "👋 <script>"'
    const html = await highlight(code, 'example', false)
    document.body.innerHTML = html
    expect(document.querySelector('pre')?.className).toBe(
      'shiki shiki-themes github-light github-dark-dimmed',
    )
    expect(document.querySelector('code')?.textContent).toBe(code)
    expect(document.querySelector('script')).toBeNull()
    expect(document.querySelector('[data-v-overflow-sentinel]')).not.toBeNull()
    expect(getCached(code, 'example', false)).toBe(html)
    expect(await highlight(code, 'example', false)).toBe(html)
    expect(setup.highlighters).toHaveLength(0)
    await vi.waitFor(() =>
      expect(document.documentElement.style.getPropertyValue('--vocs-openapi-token-key')).toMatch(
        /^light-dark\(/,
      ),
    )
    expect(document.documentElement.style.getPropertyValue('--vocs-openapi-token-value')).toMatch(
      /^light-dark\(/,
    )
  })

  it('preserves OpenAPI dim ranges, links, semantic colors, line anchors, and indentation', async () => {
    const { highlight } = await import('./CodeToHtml.client.js')
    const code = '  { "name": "👋 café", "count": 123 }\r\n  {}'
    const start = code.indexOf('👋')
    const html = await highlight(
      code,
      'json',
      false,
      [
        [start, start + 2],
        [-1, 4],
      ],
      ['first', 'second'],
      [{ range: [start + 3, start + 7], id: 'schema-name' }],
      [{ range: [code.indexOf('123'), code.indexOf('123') + 3], kind: 'value' }],
    )
    document.body.innerHTML = html
    expect(document.querySelector('code')?.textContent).toBe(code.replaceAll('\r\n', '\n'))
    expect(document.querySelector('[data-v-openapi-placeholder]')?.textContent).toBe('👋')
    expect(document.querySelector('[data-v-openapi-anchor]')?.getAttribute('data-anchor')).toBe(
      'schema-name',
    )
    expect(document.querySelector('[data-v-openapi-anchor]')?.textContent).toBe('café')
    expect(
      Array.from(document.querySelectorAll('.line')).map((node) =>
        node.getAttribute('data-anchor'),
      ),
    ).toEqual(['first', 'second'])
    expect(document.querySelector('[data-v-openapi-token="value"]')?.textContent).toBe('café')
    expect(document.querySelectorAll('[data-v-openapi-token="value"]')).toHaveLength(2)
    document.body.innerHTML = await highlight('    const x = 1', 'ts')
    expect(document.querySelector('code')?.textContent).toBe('  const x = 1')
    expect(setup.highlighters).toHaveLength(0)
  })

  it('keeps distinct cache entries for changing languages, ranges, and indentation', async () => {
    const { highlight, getCached } = await import('./CodeToHtml.client.js')
    const code = '  const x = 1'
    const plain = await highlight(code, 'ts', false)
    const shrunk = await highlight(code, 'ts', true)
    const decorated = await highlight(code, 'ts', false, [[2, 7]])
    expect(new Set([plain, shrunk, decorated]).size).toBe(3)
    expect(getCached(code, 'ts', false)).toBe(plain)
    expect(getCached(code, 'ts', true)).toBe(shrunk)
    expect(getCached(code, 'json', false)).toBeUndefined()
  })

  it('falls back safely for unknown browser languages', async () => {
    const { highlight } = await import('./CodeToHtml.client.js')
    document.body.innerHTML = await highlight('<script>alert(1)</script>', 'unknown-language')
    expect(document.querySelector('code')?.textContent).toBe('<script>alert(1)</script>')
    expect(document.querySelector('script')).toBeNull()
    expect(setup.highlighters[0]?.codeToHast).toHaveBeenCalled()
  })

  it('supports languages outside the browser Shiki bundle and concurrent calls', async () => {
    const { highlight } = await import('./CodeToHtml.client.js')
    const results = await Promise.all([
      highlight('fn main() {}', 'rust', false),
      highlight('const x = 1', 'ts', false),
    ])
    expect(results.every((html) => html.includes('light-dark('))).toBe(true)
    expect(setup.highlighters).toHaveLength(0)
  })

  it('uses configured custom grammars instead of Highlights lexers', async () => {
    setup.langs.push({
      name: 'typescript',
      scopeName: 'source.test',
      repository: {},
      aliases: ['custom-ts'],
      patterns: [{ match: 'FOO', name: 'keyword' }],
    })
    const { highlight } = await import('./CodeToHtml.client.js')
    for (const lang of ['custom-ts', 'typescript', 'ts']) {
      document.body.innerHTML = await highlight('FOO', lang, false)
      expect(document.querySelector('code')?.textContent).toBe('FOO')
    }
    expect(setup.highlighters[0]?.codeToHast).toHaveBeenCalled()
    expect(setup.highlighters[0]?.getLoadedLanguages()).toContain('typescript')
  })

  it('supports custom theme objects through the Shiki fallback', async () => {
    setup.config.codeHighlight.themes = {
      light: { name: 'custom', settings: [], fg: '#123456', bg: '#ffffff' },
    } as never
    const { highlight } = await import('./CodeToHtml.client.js')
    document.body.innerHTML = await highlight('const x = 1', 'ts', false)
    expect(document.querySelector('code')?.textContent).toBe('const x = 1')
    expect(setup.highlighters[0]?.codeToHast).toHaveBeenCalled()
    expect(setup.highlighters[0]?.getLoadedLanguages()).toContain('typescript')
  })

  it('retains the default Shiki engine', async () => {
    setup.config.codeHighlight.engine = 'shiki'
    const { highlight } = await import('./CodeToHtml.client.js')
    document.body.innerHTML = await highlight('const x = 1', 'ts', false)
    expect(document.querySelector('code')?.textContent).toBe('const x = 1')
    expect(setup.highlighters[0]?.getLoadedLanguages()).toContain('typescript')
    expect(setup.highlighters[0]?.codeToHast).toHaveBeenCalled()
  })
})
