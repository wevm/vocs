import { createHighlighter } from 'shiki'
import { describe, expect, test } from 'vitest'
import { notationCollapse, notationFold } from './shiki-transformers.js'

const highlighter = await createHighlighter({
  themes: ['github-dark'],
  langs: ['javascript', 'jsx', 'typescript'],
})

function highlight(code: string, lang = 'javascript') {
  return highlighter.codeToHtml(code, {
    lang,
    theme: 'github-dark',
    transformers: [...notationCollapse(), ...notationFold()],
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
      `// !fold[/className="(.*?)"/g]
<div className="bg-red-200">hey</div>`,
      'jsx',
    )
    expect(html).toContain('data-v-fold')
    expect(html).not.toContain('!fold')
  })

  test('folds multiple matches', () => {
    const html = highlight(
      `// !fold[/className="(.*?)"/g]
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
      `// !fold[/return \\d+/g]
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
      `// !fold[/foo/g]
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
      `// !fold[/x/g]
const x = 1`,
      'javascript',
    )
    expect(html).not.toContain('!fold[')
  })

  test('fold without global flag matches first only', () => {
    const html = highlight(
      `// !fold[/foo/]
foo bar baz`,
      'javascript',
    )
    expect(html).toContain('data-v-fold')
    const foldMatch = html.match(/<span data-v-fold[^>]*>[^<]*<\/span>/g)
    expect(foldMatch?.length).toBe(1)
  })
})
