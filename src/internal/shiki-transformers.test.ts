import { createHighlighter } from 'shiki'
import { describe, expect, test } from 'vitest'
import { notationBlock, notationCollapse, notationFold } from './shiki-transformers.js'

const highlighter = await createHighlighter({
  themes: ['github-dark'],
  langs: ['javascript', 'jsx', 'typescript', 'bash'],
})

function highlight(code: string, lang = 'javascript') {
  return highlighter.codeToHtml(code, {
    lang,
    theme: 'github-dark',
    transformers: [...notationBlock(), ...notationCollapse(), ...notationFold()],
  })
}

describe('notationCollapse', () => {
  test('basic collapse annotation', () => {
    const html = highlight(`function foo() { // [!code collapse]
  return 1
  return 2
}`)
    expect(html).toContain('data-v-collapse-trigger')
    expect(html).toContain('data-v-collapse-content')
  })

  test('collapse with count', () => {
    const html = highlight(`function foo() { // [!code collapse:2]
  return 1
  return 2
  return 3
}`)
    expect(html).toContain('data-v-collapse-trigger')
    expect(html).toContain('data-v-collapse-content')
    expect(html.match(/data-v-collapse-content/g)?.length).toBe(2)
  })

  test('collapse with collapsed state', () => {
    const html = highlight(`function foo() { // [!code collapse collapsed]
  return 1
}`)
    expect(html).toContain('data-v-collapsed')
  })

  test('adds has-collapse class', () => {
    const html = highlight(`function foo() { // [!code collapse]
  return 1
}`)
    expect(html).toContain('has-collapse')
  })

  test('no annotation produces no collapse attributes', () => {
    const html = highlight(`function foo() {
  return 1
}`)
    expect(html).not.toContain('data-v-collapse')
  })
})

describe('notationFold', () => {
  test('basic fold annotation with regex', () => {
    const html = highlight(
      `// [!code fold /className="(.*?)"/g]
<div className="bg-red-200">hey</div>`,
      'jsx',
    )
    expect(html).toContain('data-v-fold')
    expect(html).not.toContain('[!code fold')
  })

  test('folds multiple matches', () => {
    const html = highlight(
      `// [!code fold /className="(.*?)"/g]
<div className="a"><span className="b">hey</span></div>`,
      'jsx',
    )
    expect(html).toContain('data-v-fold')
    expect(html).toContain('>className<')
    expect(html).toContain('"a"')
    expect(html).toContain('"b"')
  })

  test('fold with different regex', () => {
    const html = highlight(
      `// [!code fold /return \\d+/g]
function foo() {
  return 42
  return 100
}`,
      'javascript',
    )
    expect(html).toContain('data-v-fold')
    expect(html).toContain('>return<')
    expect(html).toContain('42')
    expect(html).toContain('100')
  })

  test('adds has-fold class', () => {
    const html = highlight(
      `// [!code fold /foo/g]
const foo = 1`,
      'javascript',
    )
    expect(html).toContain('has-fold')
  })

  test('no annotation produces no fold attributes', () => {
    const html = highlight(`const foo = 1`, 'javascript')
    expect(html).not.toContain('data-v-fold')
  })

  test('removes fold annotation line', () => {
    const html = highlight(
      `// [!code fold /x/g]
const x = 1`,
      'javascript',
    )
    expect(html).not.toContain('[!code fold')
  })

  test('fold without global flag matches first only', () => {
    const html = highlight(
      `// [!code fold /foo/]
foo bar baz`,
      'javascript',
    )
    expect(html).toContain('data-v-fold')
    const foldMatch = html.match(/<span data-v-fold[^>]*>[^<]*<\/span>/g)
    expect(foldMatch?.length).toBe(1)
  })
})

function highlightBlockOnly(code: string, lang = 'javascript') {
  return highlighter.codeToHtml(code, {
    lang,
    theme: 'github-dark',
    transformers: [...notationBlock()],
  })
}

describe('notationBlock', () => {
  test('highlight block annotation', () => {
    const html = highlightBlockOnly(`function foo() {
  // [!code hl:start]
  const a = 1
  const b = 2
  // [!code hl:end]
  const c = 3
}`)
    expect(html).toContain('highlighted')
    expect(html.match(/class="[^"]*highlighted[^"]*"/g)?.length).toBe(2)
    expect(html).not.toContain('[!code hl:start]')
    expect(html).not.toContain('[!code hl:end]')
  })

  test('focus block annotation', () => {
    const html = highlightBlockOnly(`function foo() {
  // [!code focus:start]
  const a = 1
  const b = 2
  // [!code focus:end]
  const c = 3
}`)
    expect(html).toContain('focused')
    expect(html).toContain('has-focused')
    expect(html.match(/class="line focused"/g)?.length).toBe(2)
    expect(html).not.toContain('[!code focus:start]')
    expect(html).not.toContain('[!code focus:end]')
  })

  test('sequential blocks', () => {
    const html = highlightBlockOnly(`// [!code hl:start]
const a = 1
// [!code hl:end]
// [!code focus:start]
const b = 2
// [!code focus:end]`)
    expect(html).toContain('highlighted')
    expect(html).toContain('focused')
  })

  test('no annotation produces no block classes', () => {
    const html = highlightBlockOnly(`function foo() {
  return 1
}`)
    expect(html).not.toContain('highlighted')
    expect(html).not.toContain('focused')
  })

  test('unclosed block highlights to end of code', () => {
    const html = highlightBlockOnly(`const a = 1
// [!code hl:start]
const b = 2
const c = 3`)
    expect(html.match(/class="[^"]*highlighted[^"]*"/g)?.length).toBe(2)
    expect(html).not.toContain('[!code hl:start]')
  })

  test('stray end marker is removed but has no effect', () => {
    const html = highlightBlockOnly(`const a = 1
// [!code hl:end]
const b = 2`)
    expect(html).not.toContain('highlighted')
    expect(html).not.toContain('[!code hl:end]')
  })

  test('nested same-type blocks', () => {
    const html = highlightBlockOnly(`// [!code hl:start]
const a = 1
// [!code hl:start]
const b = 2
// [!code hl:end]
const c = 3
// [!code hl:end]
const d = 4`)
    expect(html.match(/class="[^"]*highlighted[^"]*"/g)?.length).toBe(3)
    expect(html).not.toContain('[!code')
  })

  test('overlapping different-type blocks', () => {
    const html = highlightBlockOnly(`// [!code hl:start]
const a = 1
// [!code focus:start]
const b = 2
// [!code hl:end]
const c = 3
// [!code focus:end]
const d = 4`)
    const highlightedCount = html.match(/class="line[^"]*highlighted[^"]*"/g)?.length ?? 0
    const focusedCount = html.match(/class="line[^"]*focused[^"]*"/g)?.length ?? 0
    expect(highlightedCount).toBe(2)
    expect(focusedCount).toBe(2)
    const bothClasses = html.match(
      /class="line[^"]*highlighted[^"]*focused[^"]*"|class="line[^"]*focused[^"]*highlighted[^"]*"/g,
    )
    expect(bothClasses?.length).toBe(1)
  })

  test('marker inside string literal is NOT detected', () => {
    const html = highlightBlockOnly(`const s = "[!code hl:start]"
const t = "[!code hl:end]"`)
    expect(html).not.toContain('highlighted')
    expect(html).toContain('[!code hl:start]')
    expect(html).toContain('[!code hl:end]')
  })

  test('line count matches content minus markers', () => {
    const html = highlightBlockOnly(`line1
// [!code hl:start]
line2
line3
// [!code hl:end]
line4`)
    const lineCount = html.match(/class="line[^"]*"/g)?.length ?? 0
    expect(lineCount).toBe(4)
  })

  test('different comment styles (bash)', () => {
    const bashHtml = highlightBlockOnly(
      `x=1
# [!code hl:start]
y=2
# [!code hl:end]
z=3`,
      'bash',
    )
    expect(bashHtml.match(/class="[^"]*highlighted[^"]*"/g)?.length).toBe(1)
    expect(bashHtml).not.toContain('[!code')
  })
})
