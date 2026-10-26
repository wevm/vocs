/** @vitest-environment jsdom */

import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { Tab, Tabs } from './Tabs.js'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function render(element: React.ReactElement) {
  const Wrapper = withNuqsTestingAdapter()
  act(() => root.render(<Wrapper>{element}</Wrapper>))
}

function panels() {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'))
}

test('keeps inactive panels mounted but hidden', () => {
  render(
    <Tabs stateKey="framework">
      <Tab title="React">
        <h2 id="react">React</h2>
      </Tab>
      <Tab title="Vue">
        <h2 id="vue">Vue</h2>
      </Tab>
    </Tabs>,
  )

  expect(
    panels().map((panel) => ({
      hidden: panel.hidden,
      tag: panel.tagName.toLowerCase(),
      text: panel.textContent,
    })),
  ).toMatchInlineSnapshot(`
    [
      {
        "hidden": false,
        "tag": "article",
        "text": "React",
      },
      {
        "hidden": true,
        "tag": "article",
        "text": "Vue",
      },
    ]
  `)

  const [, vueTab] = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'))
  act(() => vueTab?.click())

  expect(panels().map((panel) => panel.hidden)).toMatchInlineSnapshot(`
    [
      true,
      false,
    ]
  `)
})

test('renders panels as page content and forwards className', () => {
  render(
    <Tabs stateKey="framework">
      <Tab className="custom" title="React">
        Install the React adapter.
      </Tab>
    </Tabs>,
  )

  const [panel] = panels()
  expect(panel?.hasAttribute('data-v-content')).toBe(true)
  expect(panel?.className).toMatchInlineSnapshot(`"vocs:pt-4 vocs:space-y-6 custom"`)
})

test('renders every panel on the server', () => {
  const Wrapper = withNuqsTestingAdapter()
  const html = renderToString(
    <Wrapper>
      <Tabs stateKey="ssr">
        <Tab title="React">
          <h2 id="react">React</h2>
        </Tab>
        <Tab title="Vue">
          <h2 id="vue">Vue</h2>
        </Tab>
      </Tabs>
    </Wrapper>,
  )
  expect(html).toContain('id="react"')
  expect(html).toContain('id="vue"')
})
