import { type BundledLanguage, createHighlighter } from 'shiki'
import { describe, expect, it } from 'vitest'
import { notationBlock } from './shiki-transformers.js'

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
