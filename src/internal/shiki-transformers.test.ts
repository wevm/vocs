import { type BundledLanguage, createHighlighter } from 'shiki'
import { describe, expect, it } from 'vitest'
import {
  checkTwoslashSnippets,
  customTag,
  inlineLanguage,
  notationBlock,
  notationInclude,
  notationWordHighlight,
  removeNotationEscape,
  resetTwoslasher,
  resetTwoslashSnippets,
  shellNotation,
  shellPrompt,
  twoslash,
  twoslashErrors,
} from './shiki-transformers.js'
import * as Renderer from './twoslash/renderer.js'

async function highlight(code: string, lang: BundledLanguage = 'typescript') {
  const highlighter = await createHighlighter({
    themes: ['github-dark'],
    langs: [lang],
  })

  const html = highlighter.codeToHtml(code, {
    lang,
    theme: 'github-dark',
    transformers: [notationBlock()],
  })

  highlighter.dispose()
  return html
}

describe('twoslash', () => {
  it('should group adjacent custom tag comments before rendering', () => {
    const code = `const result = 1
// @error: Schema.ValidationError: Schema validation failed with 1 issue.
// @error: - Value \`nothex\` is an invalid hex value.
// @error:
// @error: Hex values must start with \`"0x"\`.`

    const normalized = Renderer.normalizeCustomTagBlocks(code)

    expect(normalized).toBe(`const result = 1
// @error: Schema.ValidationError: Schema validation failed with 1 issue.\u001f- Value \`nothex\` is an invalid hex value.\u001f\u001fHex values must start with \`"0x"\`.`)
  })

  it('should render adjacent custom tag comments as multiline tag rows', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml(
      `const result = 1
// @error: Schema.ValidationError: Schema validation failed with 1 issue.
// @error: - Value \`nothex\` is an invalid hex value.
// @error:
// @error: Hex values must start with \`"0x"\`.`,
      {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [twoslash({ explicitTrigger: false })],
      },
    )

    expect(html).toContain('twoslash-tag-error-line twoslash-tag-multiline-line')
    expect(html).toContain('Schema.ValidationError')
    expect(html).toContain('- Value `nothex` is an invalid hex value.')
    expect(html).toContain('Hex values must start with `"0x"`.')
    expect(html).not.toContain('@error')
    expect(html).not.toContain('\u001f')

    highlighter.dispose()
  })

  it('should not initialize twoslash when the transformer is created', () => {
    const tsModule = new Proxy(
      {},
      {
        get() {
          throw new Error('twoslash initialized eagerly')
        },
      },
    )

    expect(() => twoslash({ twoslashOptions: { tsModule: tsModule as never } })).not.toThrow()
  })

  it('should typecheck without rendering twoslash metadata in check-only mode', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })
    const tsModule = new Proxy(
      {},
      {
        get() {
          throw new Error('twoslash initialized')
        },
      },
    )

    const html = highlighter.codeToHtml('const value = 1\n//    ^?', {
      lang: 'typescript',
      theme: 'github-dark',
      transformers: [
        twoslash({
          checkOnly: true,
          explicitTrigger: false,
          twoslashOptions: { tsModule: tsModule as never },
          typesCache: {
            init() {
              throw new Error('cache initialized')
            },
            read() {
              throw new Error('cache read')
            },
            write() {
              throw new Error('cache written')
            },
          },
        }),
      ],
    })

    expect(html).toContain('const')
    expect(html).not.toContain('^?')
    expect(html).not.toContain('twoslash-hover')

    highlighter.dispose()
  })

  it('should collect type errors in check-only mode', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    twoslashErrors.length = 0
    resetTwoslashSnippets()

    highlighter.codeToHtml('const value: string = 1', {
      lang: 'typescript',
      theme: 'github-dark',
      transformers: [twoslash({ checkOnly: true, explicitTrigger: false })],
    })
    checkTwoslashSnippets()

    expect(twoslashErrors).toHaveLength(1)
    expect(twoslashErrors[0]?.message).toContain('Errors were thrown in the sample')

    twoslashErrors.length = 0
    resetTwoslashSnippets()

    highlighter.dispose()
  })

  it('should accept expected type errors in check-only mode', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    twoslashErrors.length = 0
    resetTwoslashSnippets()

    highlighter.codeToHtml('const value: string = 1\n// @errors: 2322', {
      lang: 'typescript',
      theme: 'github-dark',
      transformers: [twoslash({ checkOnly: true, explicitTrigger: false })],
    })
    checkTwoslashSnippets()

    expect(twoslashErrors).toHaveLength(0)

    resetTwoslashSnippets()

    highlighter.dispose()
  })

  it('should typecheck tsx snippets in check-only mode', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['tsx'],
    })

    twoslashErrors.length = 0
    resetTwoslashSnippets()

    highlighter.codeToHtml(
      `export {}
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: Record<string, never>
    }
  }
}
const element = <div />`,
      {
        lang: 'tsx',
        theme: 'github-dark',
        transformers: [twoslash({ checkOnly: true, explicitTrigger: false })],
      },
    )
    checkTwoslashSnippets()

    expect(twoslashErrors).toHaveLength(0)

    resetTwoslashSnippets()

    highlighter.dispose()
  })

  it('should keep producing correct output after the singleton twoslasher is reset', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })
    const transformer = twoslash({ explicitTrigger: false })

    const first = highlighter.codeToHtml('const a: number = 1', {
      lang: 'typescript',
      theme: 'github-dark',
      transformers: [transformer],
    })

    // Force the singleton to drop; the next call must lazily reconstruct it
    // and still produce equivalent rendered HTML.
    resetTwoslasher()

    const second = highlighter.codeToHtml('const a: number = 1', {
      lang: 'typescript',
      theme: 'github-dark',
      transformers: [transformer],
    })

    expect(second).toBe(first)

    highlighter.dispose()
  })

  it('should hide committed inline cache comments when inline cache is disabled', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml(
      `// @twoslash-cache: {"v":1,"hash":"old","data":"x"}
const value = 1`,
      {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [twoslash({ explicitTrigger: false })],
      },
    )

    expect(html).toContain('const')
    expect(html).not.toContain('twoslash-cache')

    highlighter.dispose()
  })

  it('should typecheck virtual json files in check-only mode', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    twoslashErrors.length = 0
    resetTwoslashSnippets()

    highlighter.codeToHtml(
      `// @resolveJsonModule
// @filename: app.json
{ "version": "23.2.3" }

// @filename: index.ts
import appSettings from './app.json'
appSettings.version`,
      {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [twoslash({ checkOnly: true, explicitTrigger: false })],
      },
    )
    checkTwoslashSnippets()

    expect(twoslashErrors).toHaveLength(0)

    resetTwoslashSnippets()

    highlighter.dispose()
  })

  it('should render custom tag comments in check-only mode', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml(
      `const value = 1
// @log: value: 10500000n
// @log: formatted: '10.5'`,
      {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [
          twoslash({ checkOnly: true, explicitTrigger: false, throws: false }),
          customTag(),
        ],
      },
    )

    // Check-only mode emits no twoslash tag nodes, so the downstream
    // `customTag()` transformer must render the `@log` lines instead of them
    // being stripped entirely.
    expect(html).toContain('twoslash-tag-log-line')
    expect(html).toContain('value: 10500000n')
    expect(html).toContain("formatted: '10.5'")
    expect(html).not.toContain('@log')

    // Adjacent tags must keep their source order.
    expect(html.indexOf('value: 10500000n')).toBeLessThan(html.indexOf("formatted: '10.5'"))

    highlighter.dispose()
  })
})

describe('customTag', () => {
  it('should render custom tags as styled tag lines', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml(
      `const value = 1
// @log: hello
// @error: boom`,
      {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [customTag()],
      },
    )

    expect(html).toContain('twoslash-tag-log-line')
    expect(html).toContain('twoslash-tag-error-line')
    expect(html).toContain('hello')
    expect(html).toContain('boom')
    expect(html).not.toContain('@log')
    expect(html).not.toContain('@error')

    highlighter.dispose()
  })

  it('should preserve source order for consecutive tags', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml(
      `const value = 1
// @log: one
// @log: two
// @log: three`,
      {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [customTag()],
      },
    )

    const order = [...html.matchAll(/twoslash-tag-log-line[^>]*>([^<]*)</g)].map((m) => m[1])
    expect(order).toEqual(['one', 'two', 'three'])

    highlighter.dispose()
  })

  it('should preserve leading indentation in tag content', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml(
      `const value = 1
// @log: {
// @log:   from: '0x',
// @log:   value: 1n,
// @log: }`,
      {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [customTag()],
      },
    )

    const lines = [...html.matchAll(/twoslash-tag-log-line[^>]*>([^<]*)</g)].map((m) => m[1])
    expect(lines).toEqual(['{', "  from: '0x',", '  value: 1n,', '}'])

    highlighter.dispose()
  })
})

describe('notationBlock', () => {
  describe('highlight blocks', () => {
    it('should highlight lines between hl:start and hl:end markers', async () => {
      const code = `const a = 1
// [!code hl:start]
const b = 2
const c = 3
// [!code hl:end]
const d = 4`

      const html = await highlight(code)

      expect(html).toContain('class="line highlighted"')
      expect(html).not.toContain('[!code hl:start]')
      expect(html).not.toContain('[!code hl:end]')
      expect(html).toMatch(/line highlighted[^>]*>.*\bb\b/)
      expect(html).toMatch(/line highlighted[^>]*>.*\bc\b/)
      expect(html).not.toMatch(/line highlighted[^>]*>.*\ba\b.*=.*1/)
      expect(html).not.toMatch(/line highlighted[^>]*>.*\bd\b.*=.*4/)
    })

    it('should handle multiple separate highlight blocks', async () => {
      const code = `// [!code hl:start]
const a = 1
// [!code hl:end]
const b = 2
// [!code hl:start]
const c = 3
// [!code hl:end]`

      const html = await highlight(code)

      const highlightedCount = (html.match(/class="line highlighted"/g) || []).length
      expect(highlightedCount).toBe(2)
    })

    it('should handle hash comments for Python/Ruby', async () => {
      const code = `x = 1
# [!code hl:start]
y = 2
z = 3
# [!code hl:end]
w = 4`

      const html = await highlight(code, 'python')

      expect(html).toContain('class="line highlighted"')
      expect(html).not.toContain('[!code hl:start]')
      expect(html).not.toContain('[!code hl:end]')
    })

    it('should handle HTML comments', async () => {
      const code = `<div>
<!-- [!code hl:start] -->
<span>highlighted</span>
<!-- [!code hl:end] -->
</div>`

      const html = await highlight(code, 'html')

      expect(html).toContain('class="line highlighted"')
      expect(html).not.toContain('[!code hl:start]')
      expect(html).not.toContain('[!code hl:end]')
    })

    it('should handle block comments /* */', async () => {
      const code = `const a = 1
/* [!code hl:start] */
const b = 2
/* [!code hl:end] */
const c = 3`

      const html = await highlight(code)

      expect(html).toContain('class="line highlighted"')
      expect(html).not.toContain('[!code hl:start]')
    })
  })

  describe('focus blocks', () => {
    it('should focus lines between focus:start and focus:end markers', async () => {
      const code = `const a = 1
// [!code focus:start]
const b = 2
const c = 3
// [!code focus:end]
const d = 4`

      const html = await highlight(code)

      expect(html).toContain('class="line focused"')
      expect(html).toContain('has-focused')
      expect(html).not.toContain('[!code focus:start]')
      expect(html).not.toContain('[!code focus:end]')
    })

    it('should add has-focused class to pre element', async () => {
      const code = `// [!code focus:start]
const x = 1
// [!code focus:end]`

      const html = await highlight(code)

      expect(html).toMatch(/<pre[^>]*class="[^"]*has-focused[^"]*"/)
    })
  })

  describe('mixed blocks', () => {
    it('should handle both hl and focus blocks in same code', async () => {
      const code = `const a = 1
// [!code hl:start]
const b = 2
// [!code hl:end]
// [!code focus:start]
const c = 3
// [!code focus:end]
const d = 4`

      const html = await highlight(code)

      expect(html).toContain('class="line highlighted"')
      expect(html).toContain('class="line focused"')
    })

    it('should handle overlapping hl and focus blocks', async () => {
      const code = `// [!code hl:start]
// [!code focus:start]
const a = 1
// [!code focus:end]
const b = 2
// [!code hl:end]`

      const html = await highlight(code)

      expect(html).toContain('highlighted')
      expect(html).toContain('focused')
    })

    it('should apply both classes to overlapping lines', async () => {
      const code = `// [!code hl:start]
// [!code focus:start]
const a = 1
// [!code hl:end]
// [!code focus:end]`

      const html = await highlight(code)

      expect(html).toMatch(/class="line (highlighted focused|focused highlighted)"/)
    })
  })

  describe('edge cases', () => {
    it('should handle empty blocks', async () => {
      const code = `const a = 1
// [!code hl:start]
// [!code hl:end]
const b = 2`

      const html = await highlight(code)

      expect(html).not.toContain('[!code hl:start]')
      expect(html).not.toContain('[!code hl:end]')
    })

    it('should handle unclosed blocks (apply to end of file)', async () => {
      const code = `const a = 1
// [!code hl:start]
const b = 2
const c = 3`

      const html = await highlight(code)

      const highlightedCount = (html.match(/class="line highlighted"/g) || []).length
      expect(highlightedCount).toBe(2)
    })

    it('should handle nested blocks of same type gracefully', async () => {
      const code = `// [!code hl:start]
const a = 1
// [!code hl:start]
const b = 2
// [!code hl:end]
const c = 3
// [!code hl:end]`

      const html = await highlight(code)

      expect(html).toContain('highlighted')
      expect(html).not.toContain('[!code hl:start]')
    })

    it('should handle markers with extra whitespace', async () => {
      const code = `const a = 1
//   [!code hl:start]
const b = 2
//   [!code hl:end]
const c = 3`

      const html = await highlight(code)

      expect(html).toContain('class="line highlighted"')
    })

    it('should preserve code without any markers', async () => {
      const code = `const a = 1
const b = 2
const c = 3`

      const html = await highlight(code)

      expect(html).not.toContain('highlighted')
      expect(html).not.toContain('focused')
      expect(html).toContain('a')
      expect(html).toContain('b')
      expect(html).toContain('c')
    })

    it('should not match partial markers', async () => {
      const code = `// [!code hl:star]
const a = 1
// [!code hl:ending]`

      const html = await highlight(code)

      expect(html).not.toContain('highlighted')
      expect(html).toContain('[!code hl:star]')
    })
  })

  describe('custom options', () => {
    it('should use custom highlight class', async () => {
      const highlighter = await createHighlighter({
        themes: ['github-dark'],
        langs: ['typescript'],
      })

      const code = `// [!code hl:start]
const a = 1
// [!code hl:end]`

      const html = highlighter.codeToHtml(code, {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [notationBlock({ highlightClass: 'my-highlight' })],
      })

      highlighter.dispose()

      expect(html).toContain('my-highlight')
      expect(html).not.toContain('highlighted')
    })

    it('should use custom focus class', async () => {
      const highlighter = await createHighlighter({
        themes: ['github-dark'],
        langs: ['typescript'],
      })

      const code = `// [!code focus:start]
const a = 1
// [!code focus:end]`

      const html = highlighter.codeToHtml(code, {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [notationBlock({ focusClass: 'my-focus' })],
      })

      highlighter.dispose()

      expect(html).toContain('my-focus')
    })

    it('should use custom focus active pre class', async () => {
      const highlighter = await createHighlighter({
        themes: ['github-dark'],
        langs: ['typescript'],
      })

      const code = `// [!code focus:start]
const a = 1
// [!code focus:end]`

      const html = highlighter.codeToHtml(code, {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [notationBlock({ focusActivePreClass: 'custom-has-focus' })],
      })

      highlighter.dispose()

      expect(html).toContain('custom-has-focus')
      expect(html).not.toContain('has-focused')
    })
  })
})

describe('shellPrompt', () => {
  it('should mark shell prompt lines with data-v-shell-line', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['bash'],
    })

    const code = `$ echo hello
$ ls -la`

    const html = highlighter.codeToHtml(code, {
      lang: 'bash',
      theme: 'github-dark',
      transformers: [shellPrompt()],
    })

    highlighter.dispose()

    expect(html).toContain('data-v-shell')
    expect(html).toContain('data-v-shell-line')
    expect(html).toContain('data-v-shell-prompt')
  })

  it('should apply consistent styling with dual themes (light-dark)', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark-dimmed'],
      langs: ['bash'],
    })

    const code = `$ forge test
output
$ forge build`

    const html = highlighter.codeToHtml(code, {
      lang: 'bash',
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      defaultColor: 'light-dark()',
      transformers: [shellPrompt()],
    })

    highlighter.dispose()

    // Both command lines should be marked
    const shellLineMatches = html.match(/data-v-shell-line/g)
    expect(shellLineMatches?.length).toBe(2)

    // With dual themes, Shiki properly tokenizes each command
    // Check that both commands have proper light-dark styling
    expect(html).toContain('light-dark(')
  })

  it('should not process non-shell languages', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const code = `$ echo hello`

    const html = highlighter.codeToHtml(code, {
      lang: 'typescript',
      theme: 'github-dark',
      transformers: [shellPrompt()],
    })

    highlighter.dispose()

    expect(html).not.toContain('data-v-shell')
  })
})

describe('shellNotation', () => {
  it('should highlight bash lines with backslash continuation before # [!code hl]', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['bash'],
    })

    const code = `tempo node \\
  --follow \\ # [!code hl]
  --http --http.port 8545`

    const html = highlighter.codeToHtml(code, {
      lang: 'bash',
      theme: 'github-dark',
      transformers: [shellNotation()],
    })

    highlighter.dispose()

    expect(html).toContain('highlighted')
    expect(html).not.toContain('[!code hl]')
    // The backslash continuation should be preserved
    expect(html).toContain('--follow')
  })

  it('should not affect non-shell languages', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const code = `const x = 'test \\\\ # [!code hl]'`

    const html = highlighter.codeToHtml(code, {
      lang: 'typescript',
      theme: 'github-dark',
      transformers: [shellNotation()],
    })

    highlighter.dispose()

    expect(html).not.toContain('highlighted')
  })

  it('should handle focus annotations', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['bash'],
    })

    const code = `tempo node \\
  --follow \\ # [!code focus]
  --http`

    const html = highlighter.codeToHtml(code, {
      lang: 'bash',
      theme: 'github-dark',
      transformers: [shellNotation()],
    })

    highlighter.dispose()

    expect(html).toContain('focused')
    expect(html).not.toContain('[!code focus]')
  })
})

describe('inlineLanguage', () => {
  it('should add data-language attribute to code element', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['javascript'],
    })

    const html = highlighter.codeToHtml('console.log("hello")', {
      lang: 'javascript',
      theme: 'github-dark',
      transformers: [inlineLanguage()],
    })

    highlighter.dispose()

    expect(html).toContain('data-language="javascript"')
    expect(html).toContain('<code')
  })

  it('should not add data-language for plaintext', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['javascript'],
    })

    const html = highlighter.codeToHtml('some text', {
      lang: 'plaintext',
      theme: 'github-dark',
      transformers: [inlineLanguage()],
    })

    highlighter.dispose()

    expect(html).not.toContain('data-language=')
  })
})

describe('removeNotationEscape', () => {
  it('renders escaped snippet notation without executing it', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml('// [\\!include ~/snippets/example.ts]', {
      lang: 'typescript',
      theme: 'github-dark',
      transformers: [
        notationInclude({ rootDir: process.cwd(), srcDir: 'site/src' }),
        removeNotationEscape(),
      ],
    })

    highlighter.dispose()

    expect(html).toContain('[!include ~/snippets/example.ts]')
    expect(html).not.toContain('[\\!include')
    expect(html).not.toContain('createPublicClient')
  })
})

describe('notationWordHighlight', () => {
  it('highlights the word in plain tokens', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml('// [!code word:retriever]\nconst retriever = 1', {
      lang: 'typescript',
      theme: 'github-dark',
      transformers: [notationWordHighlight()],
    })

    highlighter.dispose()

    expect(html).not.toContain('[!code')
    expect(html.match(/highlighted-word/g)).toHaveLength(1)
    expect(html).toMatch(/class="highlighted-word">retriever</)
  })

  it('highlights element-wrapped tokens (twoslash hovers) instead of their neighbors', async () => {
    // Mimics the twoslash transformer: wraps identifier tokens in a popup
    // container whose first child is the code and the rest is popup markup
    // (which also contains the word, and must not create phantom matches).
    const wrapIdentifiers: import('@shikijs/types').ShikiTransformer = {
      name: 'test:wrap-identifiers',
      code(code) {
        for (const line of code.children) {
          if (line.type !== 'element') continue
          for (const token of line.children) {
            if (token.type !== 'element') continue
            const text = token.children[0]
            if (text?.type !== 'text' || !/^\s*[A-Za-z_$][\w$]*\s*$/.test(text.value)) continue
            token.children = [
              {
                type: 'element',
                tagName: 'span',
                properties: { class: 'twoslash-hover twoslash-popup-container' },
                children: [
                  text,
                  {
                    type: 'element',
                    tagName: 'div',
                    properties: { class: 'twoslash-popup-docs' },
                    children: [{ type: 'text', value: '(property) retriever: LocalRetriever' }],
                  },
                ],
              },
            ]
          }
        }
      },
    }

    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml(
      '// [!code word:retriever]\nconst retriever = Retriever.local({})',
      {
        lang: 'typescript',
        theme: 'github-dark',
        transformers: [wrapIdentifiers, notationWordHighlight()],
      },
    )

    highlighter.dispose()

    // The wrapped `retriever` token itself is highlighted (case-sensitive, so
    // `Retriever` is not), and neither punctuation neighbors nor popup text are.
    expect(html.match(/highlighted-word/g)).toHaveLength(1)
    expect(html).toContain(
      'highlighted-word"><span class="twoslash-hover twoslash-popup-container"> retriever<div',
    )
  })
})
