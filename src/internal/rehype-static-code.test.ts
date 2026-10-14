/** @vitest-environment jsdom */
import { compile, run } from '@mdx-js/mdx'
import type * as HAst from 'hast'
import { createElement } from 'react'
import * as runtime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { rehypeStaticCode } from './rehype-static-code.js'

const text = (value: string): HAst.Text => ({ type: 'text', value })
const element = (
  tagName: string,
  properties: HAst.Properties,
  children: HAst.ElementContent[] = [],
): HAst.Element => ({ type: 'element', tagName, properties, children })
const line = (...children: HAst.ElementContent[]) => element('span', { class: 'line' }, children)

// Shiki-like output with a static line, a Twoslash popup, and an internal link.
const pre = () =>
  element('pre', { class: 'shiki' }, [
    element('code', {}, [
      line(
        element('span', { style: 'color:red' }, [text('const')]),
        element('span', { style: 'color:blue' }, [text(' a <b>')]),
      ),
      text('\n'),
      line(
        element('span', { className: ['twoslash-hover'] }, [
          element('span', {}, [text('client')]),
          element('span', { class: 'twoslash-popup-container' }, [
            element('div', { class: 'twoslash-popup-docs', 'data-v-overflow-fade': true }, [
              element('p', {}, [
                text('See '),
                element('a', { href: 'https://viem.sh' }, [text('docs')]),
                text(' for '),
                element('code', { 'data-v': true }, [text('x')]),
              ]),
            ]),
          ]),
        ]),
      ),
      text('\n'),
      line(element('a', { href: '/guide' }, [text('guide')]), element('span', {}, [text('!')])),
    ]),
  ])

// Mirrors the relevant behavior of `components` in `src/mdx.tsx` and `Link`.
const components = {
  a: (props: { href: string }) =>
    createElement('a', {
      ...props,
      'data-v-link': true,
      'data-v': true,
      ...(props.href.startsWith('https://')
        ? { rel: 'noopener noreferrer', target: '_blank' }
        : {}),
    }),
  code: (props: object) => createElement('code', { ...props, 'data-v': true }),
  span: (props: object) => createElement('span', props),
}

async function render(plugins: (() => (tree: HAst.Root) => void)[]) {
  const code = String(
    await compile('', {
      outputFormat: 'function-body',
      rehypePlugins: [
        () => (tree: HAst.Root) => {
          tree.children = [pre()]
        },
        ...plugins,
      ],
    }),
  )
  const { default: Content } = await run(code, { ...runtime, baseUrl: import.meta.url })
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(createElement(Content, { components }))
  return { code, container }
}

describe('rehypeStaticCode', () => {
  it('renders the same DOM', async () => {
    const before = await render([])
    const after = await render([rehypeStaticCode])
    expect(after.container.isEqualNode(before.container)).toBe(true)
    expect(after.container.innerHTML).toContain('data-v-overflow-fade="true"')
  })

  it('serializes static subtrees and keeps component elements', async () => {
    const { code } = await render([rehypeStaticCode])
    // The static line and the popup container become HTML strings.
    expect(code.match(/dangerouslySetInnerHTML/g)).toHaveLength(2)
    // The Twoslash hover and the internal link still render through MDX components.
    expect(code).toMatch(/_components\.span, \{\s*className: "twoslash-hover"/)
    expect(code).toMatch(/_components\.a, \{\s*href: "\/guide"/)
    expect(code).not.toMatch(/_components\.a, \{\s*href: "https:\/\/viem\.sh"/)
  })
})
