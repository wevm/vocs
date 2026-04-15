// @vitest-environment jsdom

import { createHighlighter } from 'shiki'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  classNameForTokenStyle,
  dataAttribute,
  installTokenClassesRuntime,
  splitStyle,
  styleAttribute,
  tokenClasses,
} from './shiki-token-classes.js'

// biome-ignore lint/suspicious/noExplicitAny: test fixture for untyped HAST nodes
function makeRoot(styles: string[]): any {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: {},
            children: styles.map((style) => ({
              type: 'element',
              tagName: 'span',
              properties: { style },
              children: [{ type: 'text', value: 'token' }],
            })),
          },
        ],
      },
    ],
  }
}

// biome-ignore lint/suspicious/noExplicitAny: test fixture for untyped HAST nodes
function getPre(root: any) {
  return root.children[0]
}

// biome-ignore lint/suspicious/noExplicitAny: test fixture for untyped HAST nodes
function getSpans(root: any) {
  return root.children[0].children[0].children
}

function getClassName(value: unknown) {
  return Array.isArray(value) ? value.join(' ') : String(value)
}

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  Reflect.deleteProperty(window as unknown as Record<string, unknown>, '__vocsShikiTokenClasses')
})

describe('splitStyle', () => {
  it('separates token colors from other inline styles', () => {
    expect(
      splitStyle(
        'color:light-dark(#111111, #eeeeee);--shiki-light:#111111;--shiki-dark:#eeeeee;font-style:italic',
      ),
    ).toEqual({
      color: 'color:light-dark(#111111, #eeeeee);--shiki-light:#111111;--shiki-dark:#eeeeee',
      rest: 'font-style:italic',
    })
  })
})

describe('tokenClasses', () => {
  it('replaces repeated color styles with shared classes and per-block css', () => {
    const styleA = 'color:light-dark(#D73A49, #F47067);--shiki-light:#D73A49;--shiki-dark:#F47067'
    const styleB = 'color:light-dark(#24292E, #ADBAC7);--shiki-light:#24292E;--shiki-dark:#ADBAC7'
    const root = makeRoot([styleA, styleB, styleA, styleB])

    tokenClasses().root?.call({} as never, root)

    const pre = getPre(root)
    const spans = getSpans(root)
    const css = String(pre.properties[dataAttribute])
    const rules = css.split('\n')

    expect(rules).toHaveLength(2)
    expect(rules[0]).toContain(styleA)
    expect(rules[1]).toContain(styleB)
    expect(getClassName(spans[0]?.properties.class)).toBe(getClassName(spans[2]?.properties.class))
    expect(getClassName(spans[1]?.properties.class)).toBe(getClassName(spans[3]?.properties.class))

    for (const span of spans) {
      expect(span.properties.style).toBeUndefined()
      expect(getClassName(span.properties.class)).toMatch(/^vocs-shiki-/)
    }
  })

  it('preserves non-color inline styles', () => {
    const root = makeRoot([
      'color:light-dark(#D73A49, #F47067);--shiki-light:#D73A49;--shiki-dark:#F47067;font-style:italic',
    ])

    tokenClasses().root?.call({} as never, root)

    const [span] = getSpans(root)
    expect(span?.properties.style).toBe('font-style:italic')
    expect(getClassName(span?.properties.class)).toMatch(/^vocs-shiki-/)
  })

  it('emits css on every block while keeping class names stable', () => {
    const style = 'color:light-dark(#D73A49, #F47067);--shiki-light:#D73A49;--shiki-dark:#F47067'
    const firstRoot = makeRoot([style])
    const secondRoot = makeRoot([style])

    tokenClasses().root?.call({} as never, firstRoot)
    tokenClasses().root?.call({} as never, secondRoot)

    const firstPre = getPre(firstRoot)
    const secondPre = getPre(secondRoot)
    const firstClass = getClassName(getSpans(firstRoot)[0]?.properties.class)
    const secondClass = getClassName(getSpans(secondRoot)[0]?.properties.class)

    expect(firstClass).toBe(secondClass)
    expect(firstPre.properties[dataAttribute]).toContain(`.${firstClass}{${style}}`)
    expect(secondPre.properties[dataAttribute]).toContain(`.${secondClass}{${style}}`)
  })

  it('integrates with dual-theme shiki output', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark-dimmed'],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml('const value = 1', {
      lang: 'typescript',
      themes: { dark: 'github-dark-dimmed', light: 'github-light' },
      defaultColor: 'light-dark()',
      rootStyle: false,
      transformers: [tokenClasses()],
    })

    highlighter.dispose()

    expect(html).toContain(dataAttribute)
    expect(html).toContain('class="vocs-shiki-')
    expect(html).not.toContain('style="color:light-dark(')
  })
})

describe('tokenClassesScript', () => {
  it('collects block css once and removes data attributes', () => {
    const sharedClass = classNameForTokenStyle(
      'color:light-dark(#D73A49, #F47067);--shiki-light:#D73A49;--shiki-dark:#F47067',
    )
    const uniqueClass = classNameForTokenStyle(
      'color:light-dark(#24292E, #ADBAC7);--shiki-light:#24292E;--shiki-dark:#ADBAC7',
    )
    const sharedRule = `.${sharedClass}{color:light-dark(#D73A49, #F47067);--shiki-light:#D73A49;--shiki-dark:#F47067}`
    const uniqueRule = `.${uniqueClass}{color:light-dark(#24292E, #ADBAC7);--shiki-light:#24292E;--shiki-dark:#ADBAC7}`

    document.body.innerHTML = `
      <pre ${dataAttribute}="${sharedRule}\n${uniqueRule}"></pre>
      <pre ${dataAttribute}="${sharedRule}"></pre>
    `

    installTokenClassesRuntime(document, window, dataAttribute, styleAttribute)

    const style = document.querySelector(`style[${styleAttribute}]`)
    expect(style?.textContent).toBe(`${sharedRule}${uniqueRule}`)
    expect(document.querySelectorAll(`pre[${dataAttribute}]`)).toHaveLength(0)
  })

  it('flushes code blocks added after the initial render', () => {
    const className = classNameForTokenStyle(
      'color:light-dark(#79C0FF, #79C0FF);--shiki-light:#79C0FF;--shiki-dark:#79C0FF',
    )
    const rule = `.${className}{color:light-dark(#79C0FF, #79C0FF);--shiki-light:#79C0FF;--shiki-dark:#79C0FF}`

    installTokenClassesRuntime(document, window, dataAttribute, styleAttribute)

    const pre = document.createElement('pre')
    pre.setAttribute(dataAttribute, rule)
    document.body.appendChild(pre)

    window.__vocsShikiTokenClasses?.flush(document.body)

    const style = document.querySelector(`style[${styleAttribute}]`)
    expect(style?.textContent).toBe(rule)
    expect(pre.hasAttribute(dataAttribute)).toBe(false)
  })
})
