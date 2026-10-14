/** @vitest-environment jsdom */
import { compile, run } from '@mdx-js/mdx'
import type * as HAst from 'hast'
import { createElement } from 'react'
import * as runtime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { CodeTree } from '../react/internal/CodeTree.mdx.js'
import { rehypeStaticCode } from './rehype-static-code.js'

// `CodeTree` renders through the same components as the MDX content.
vi.mock('../mdx.js', () => ({ useMDXComponents: () => components }))

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
  VocsCodeTree: CodeTree,
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

  it('renders code block contents through one call site', async () => {
    const { code } = await render([rehypeStaticCode])
    expect(code.match(/_jsx\(VocsCodeTree/g)).toHaveLength(1)
    expect(code).not.toContain('_components.span')
    // The static line and the popup container become HTML strings.
    expect(code.match(/"tagName": "vocs-static-html"/g)).toHaveLength(2)
    // The Twoslash hover and the internal link stay elements for MDX components.
    expect(code).toContain('"twoslash-hover"')
    expect(code).toMatch(/"tagName": "a",\s*"properties": \{\s*"href": "\/guide"/)
  })
})
