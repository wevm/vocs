// @vitest-environment jsdom

import { createHighlighter } from 'shiki'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  classNameForTokenStyle,
  dataAttribute,
  installTokenClassesRuntime,
  splitStyle,
  styleAttribute,
  tokenClasses,
} from './shiki-token-classes.js'

const styleA = 'color:light-dark(#D73A49, #F47067);--shiki-light:#D73A49;--shiki-dark:#F47067'
const styleB = 'color:light-dark(#24292E, #ADBAC7);--shiki-light:#24292E;--shiki-dark:#ADBAC7'

type SpanFixture = {
  children?: SpanFixture[]
  className?: string | string[]
  style?: string
  text?: string
}

// biome-ignore lint/suspicious/noExplicitAny: test fixture for untyped HAST nodes
function makeRoot(spans: SpanFixture[]): any {
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
            children: spans.map(makeSpan),
          },
        ],
      },
    ],
  }
}

// biome-ignore lint/suspicious/noExplicitAny: test fixture for untyped HAST nodes
function makeSpan({ children, className, style, text = 'token' }: SpanFixture): any {
  return {
    type: 'element',
    tagName: 'span',
    properties: {
      ...(className ? { class: Array.isArray(className) ? className : [className] } : {}),
      ...(style ? { style } : {}),
    },
    children: children?.map(makeSpan) ?? [
      {
        type: 'text',
        value: text,
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

function getRules(root: any) {
  const css = root.children[0]?.properties[dataAttribute]
  return typeof css === 'string' ? css.split('\n') : []
}

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  Reflect.deleteProperty(window as unknown as Record<string, unknown>, '__vocsShikiTokenClasses')
})

describe('splitStyle', () => {
  it.each([
    {
      name: 'separates token colors from other inline styles',
      style:
        'color:light-dark(#111111, #eeeeee);--shiki-light:#111111;--shiki-dark:#eeeeee;font-style:italic',
      expected: {
        color: 'color:light-dark(#111111, #eeeeee);--shiki-light:#111111;--shiki-dark:#eeeeee',
        rest: 'font-style:italic',
      },
    },
    {
      name: 'extracts background token declarations',
      style:
        'background-color:light-dark(#ffffff, #000000);--shiki-light-bg:#ffffff;--shiki-dark-bg:#000000;opacity:0.8',
      expected: {
        color:
          'background-color:light-dark(#ffffff, #000000);--shiki-light-bg:#ffffff;--shiki-dark-bg:#000000',
        rest: 'opacity:0.8',
      },
    },
    {
      name: 'ignores malformed declarations while keeping valid ones',
      style: 'color:light-dark(#111111, #eeeeee);broken;font-weight:700',
      expected: {
        color: 'color:light-dark(#111111, #eeeeee)',
        rest: 'font-weight:700',
      },
    },
  ])('$name', ({ style, expected }) => {
    expect(splitStyle(style)).toEqual(expected)
  })
})

describe('tokenClasses', () => {
  it.each([
    {
      name: 'replaces repeated color styles with shared classes and per-block css',
      spans: [{ style: styleA }, { style: styleB }, { style: styleA }, { style: styleB }],
      expectedRuleCount: 2,
      expectedInlineStyles: [undefined, undefined, undefined, undefined],
      assert(spans: any[]) {
        expect(getClassName(spans[0]?.properties.class)).toBe(
          getClassName(spans[2]?.properties.class),
        )
        expect(getClassName(spans[1]?.properties.class)).toBe(
          getClassName(spans[3]?.properties.class),
        )
      },
    },
    {
      name: 'preserves non-color inline styles',
      spans: [{ style: `${styleA};font-style:italic` }],
      expectedRuleCount: 1,
      expectedInlineStyles: ['font-style:italic'],
    },
    {
      name: 'leaves non-token inline styles untouched',
      spans: [{ style: 'font-style:italic' }],
      expectedRuleCount: 0,
      expectedInlineStyles: ['font-style:italic'],
      expectTokenClass: false,
    },
    {
      name: 'keeps existing classes when appending token classes',
      spans: [{ className: 'existing-token', style: styleA }],
      expectedRuleCount: 1,
      expectedInlineStyles: [undefined],
      assert(spans: any[]) {
        expect(getClassName(spans[0]?.properties.class)).toContain('existing-token')
      },
    },
  ])('$name', ({
    spans: fixtures,
    expectedInlineStyles,
    expectedRuleCount,
    expectTokenClass = true,
    assert,
  }) => {
    const root = makeRoot(fixtures)

    tokenClasses().root?.call({} as never, root)

    const spans = getSpans(root)
    const rules = getRules(root)

    expect(rules).toHaveLength(expectedRuleCount)
    expectedInlineStyles.forEach((style, index) => {
      expect(spans[index]?.properties.style).toBe(style)
      if (expectTokenClass) {
        expect(getClassName(spans[index]?.properties.class)).toMatch(/(?:^| )vocs-shiki-/)
      } else {
        expect(spans[index]?.properties.class).toBeUndefined()
      }
    })

    assert?.(spans)
  })

  it('walks nested spans and emits css for descendant tokens', () => {
    const root = makeRoot([
      {
        children: [{ style: styleA, text: 'nested-token' }],
      },
    ])

    tokenClasses().root?.call({} as never, root)

    const outerSpan = getSpans(root)[0]
    const innerSpan = outerSpan?.children[0]

    expect(outerSpan?.properties.class).toBeUndefined()
    expect(getClassName(innerSpan?.properties.class)).toMatch(/^vocs-shiki-/)
    expect(getRules(root)).toEqual([expect.stringContaining(styleA)])
  })

  it('emits css on every block while keeping class names stable', () => {
    const firstRoot = makeRoot([{ style: styleA }])
    const secondRoot = makeRoot([{ style: styleA }])

    tokenClasses().root?.call({} as never, firstRoot)
    tokenClasses().root?.call({} as never, secondRoot)

    const firstPre = getPre(firstRoot)
    const secondPre = getPre(secondRoot)
    const firstClass = getClassName(getSpans(firstRoot)[0]?.properties.class)
    const secondClass = getClassName(getSpans(secondRoot)[0]?.properties.class)

    expect(firstClass).toBe(secondClass)
    expect(firstPre.properties[dataAttribute]).toContain(`.${firstClass}{${styleA}}`)
    expect(secondPre.properties[dataAttribute]).toContain(`.${secondClass}{${styleA}}`)
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

describe('installTokenClassesRuntime', () => {
  it.each([
    {
      name: 'collects block css once and removes data attributes',
      setup() {
        const sharedClass = classNameForTokenStyle(styleA)
        const uniqueClass = classNameForTokenStyle(styleB)
        const sharedRule = `.${sharedClass}{${styleA}}`
        const uniqueRule = `.${uniqueClass}{${styleB}}`

        document.body.innerHTML = `
          <pre ${dataAttribute}="${sharedRule}\n${uniqueRule}"></pre>
          <pre ${dataAttribute}="${sharedRule}"></pre>
        `

        return {
          expectedCss: `${sharedRule}${uniqueRule}`,
          flushRoot: document,
          installFirst: false,
          pre: document.querySelector('pre'),
          wrapper: undefined,
        }
      },
    },
    {
      name: 'flushes nested blocks added after the initial render',
      setup() {
        const className = classNameForTokenStyle(
          'color:light-dark(#79C0FF, #79C0FF);--shiki-light:#79C0FF;--shiki-dark:#79C0FF',
        )
        const rule = `.${className}{color:light-dark(#79C0FF, #79C0FF);--shiki-light:#79C0FF;--shiki-dark:#79C0FF}`
        const wrapper = document.createElement('div')
        wrapper.innerHTML = `<section><pre ${dataAttribute}="${rule}"></pre></section>`
        return {
          expectedCss: rule,
          flushRoot: wrapper,
          installFirst: true,
          pre: wrapper.querySelector('pre'),
          wrapper,
        }
      },
    },
  ])('$name', ({ setup }) => {
    const { expectedCss, flushRoot, installFirst, pre, wrapper } = setup()
    if (installFirst) installTokenClassesRuntime(document, window, dataAttribute, styleAttribute)
    if (wrapper) document.body.appendChild(wrapper)
    if (!installFirst) installTokenClassesRuntime(document, window, dataAttribute, styleAttribute)
    window.__vocsShikiTokenClasses?.flush(flushRoot)

    const style = document.querySelector(`style[${styleAttribute}]`)
    expect(style?.textContent).toBe(expectedCss)
    expect(pre?.hasAttribute(dataAttribute)).toBe(false)
  })

  it('reuses the installed runtime and existing style element on repeat installs', () => {
    const className = classNameForTokenStyle(styleA)
    const rule = `.${className}{${styleA}}`
    document.body.innerHTML = `<pre ${dataAttribute}="${rule}"></pre>`

    installTokenClassesRuntime(document, window, dataAttribute, styleAttribute)

    const runtime = window.__vocsShikiTokenClasses
    const flushSpy = runtime ? vi.spyOn(runtime, 'flush') : undefined
    document.body.innerHTML = `<pre ${dataAttribute}="${rule}"></pre>`

    installTokenClassesRuntime(document, window, dataAttribute, styleAttribute)

    expect(flushSpy).toHaveBeenCalledWith(document)
    expect(document.querySelectorAll(`style[${styleAttribute}]`)).toHaveLength(1)
    expect(document.querySelector(`style[${styleAttribute}]`)?.textContent).toBe(rule)
  })
})
