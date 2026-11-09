/** @vitest-environment jsdom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeBlock } from './CodeBlock.mdx.js'
import { CodeGroup } from './CodeGroup.mdx.js'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('CodeBlock', () => {
  it('renders its buttons next to the `<pre>`, so they stay put when the code scrolls', async () => {
    await render(
      <CodeBlock data-title="example.ts" data-v-show-wrap="">
        {code('const a = 1', 'const b = 2')}
      </CodeBlock>,
    )

    const pre = container.querySelector('pre')
    expect(pre?.querySelector('button')).toBeNull()
    expect(
      Array.from(pre?.parentElement?.children ?? []).map(
        (el) => el.getAttribute('aria-label') ?? el.tagName,
      ),
    ).toMatchInlineSnapshot(`
      [
        "PRE",
        "Disable word wrap",
        "Copy code",
      ]
    `)
    expect(pre?.parentElement?.hasAttribute('data-v-code-block')).toBe(true)
  })

  it('copies the code', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    await render(<CodeBlock>{code('const a = 1', 'const b = 2')}</CodeBlock>)

    await act(async () => button('Copy code')?.click())

    expect(writeText).toHaveBeenCalledWith('const a = 1\nconst b = 2')
    expect(button('Copied')).not.toBeNull()
  })

  it('toggles wrapping on the `<pre>`', async () => {
    await render(<CodeBlock data-v-show-wrap="">{code('const a = 1')}</CodeBlock>)
    const pre = container.querySelector('pre')
    expect(pre?.hasAttribute('data-v-wrapped')).toBe(true)

    await act(async () => button('Disable word wrap')?.click())
    expect(pre?.hasAttribute('data-v-wrapped')).toBe(false)

    await act(async () => button('Enable word wrap')?.click())
    expect(pre?.hasAttribute('data-v-wrapped')).toBe(true)
  })

  it('centers the buttons on one-line blocks', async () => {
    await render(<CodeBlock data-v-show-wrap="">{code('const a = 1')}</CodeBlock>)

    expect(button('Disable word wrap')?.dataset['singleLine']).toBe('true')
    expect(button('Copy code')?.dataset['singleLine']).toBe('true')
  })

  it('copies each shell command from its own button, at the end of its line', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    await render(
      <CodeBlock data-v-shell="">
        <code>
          {shellLine('pnpm install')}
          {'\n'}
          <span className="line">done</span>
          {'\n'}
          {shellLine('pnpm dev')}
        </code>
      </CodeBlock>,
    )

    expect(button('Copy code')).toBeNull()
    const lines = container.querySelectorAll('.line[data-v-shell-line]')
    for (const line of lines)
      expect(line.lastElementChild?.matches('[data-v-shell-copy-track]')).toBe(true)

    const buttons = container.querySelectorAll<HTMLButtonElement>('[data-v-shell-copy]')
    expect(buttons).toHaveLength(2)
    await act(async () => buttons[1]?.click())

    expect(writeText).toHaveBeenCalledWith('pnpm dev')
  })
})

describe('CodeGroup', () => {
  it("keeps each block's buttons", async () => {
    await render(
      <CodeGroup>
        <div data-v-code-group-item="" data-title="index.ts">
          {CodeBlock({ 'data-title': 'index.ts', children: code('const a = 1') })}
        </div>
        <div data-v-code-group-item="" data-title="index.js">
          {CodeBlock({ 'data-title': 'index.js', children: code('var a = 1') })}
        </div>
      </CodeGroup>,
    )

    const panels = container.querySelectorAll('[data-v-code-group-panel]')
    expect(panels).toHaveLength(2)
    for (const panel of panels) {
      expect(panel.querySelector('[data-v-code-header]')).toBeNull()
      expect(panel.querySelector('[data-v-code-block] > pre + button')).not.toBeNull()
    }
  })
})

async function render(element: React.ReactNode) {
  await act(async () => root.render(element))
}

function button(label: string) {
  return container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
}

function code(...lines: string[]) {
  return (
    <code>
      {lines.flatMap((line, i) => [
        i > 0 ? '\n' : null,
        <span className="line" key={line}>
          {line}
        </span>,
      ])}
    </code>
  )
}

function shellLine(command: string) {
  return (
    <span className="line" data-v-shell-line="">
      <span data-v-shell-prompt="">$ </span>
      <span>{command}</span>
    </span>
  )
}

function setClipboard(clipboard: Pick<Clipboard, 'writeText'> | undefined) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard })
}
