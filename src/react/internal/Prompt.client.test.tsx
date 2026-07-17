/** @vitest-environment jsdom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PromptFrame } from './Prompt.client.js'

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

describe('PromptFrame', () => {
  it('starts collapsed and toggles prompt visibility without copying', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    await render('Prompt')

    const content = container.querySelector<HTMLElement>('[data-v-prompt-content]')
    const toggle = container.querySelector<HTMLButtonElement>('[data-v-prompt-toggle]')
    expect(content?.hidden).toBe(true)
    expect(toggle?.getAttribute('aria-expanded')).toBe('false')
    expect(toggle?.getAttribute('aria-label')).toBe('View Prompt')
    expect(container.querySelectorAll('[data-v-prompt-action]')).toHaveLength(3)

    await act(async () => toggle?.click())

    expect(content?.hidden).toBe(false)
    expect(toggle?.getAttribute('aria-expanded')).toBe('true')
    expect(toggle?.getAttribute('aria-label')).toBe('Hide Prompt')
    expect(writeText).not.toHaveBeenCalled()

    await act(async () => toggle?.click())

    expect(content?.hidden).toBe(true)
    expect(toggle?.getAttribute('aria-label')).toBe('View Prompt')
  })

  it('copies the exact prompt from the primary action and expanded body', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    await render('First line\n\nSecond line')

    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-v-prompt-copy]')?.click(),
    )
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-v-prompt-toggle]')?.click(),
    )
    await act(async () => container.querySelector('pre')?.click())

    expect(writeText).toHaveBeenNthCalledWith(1, 'First line\n\nSecond line')
    expect(writeText).toHaveBeenNthCalledWith(2, 'First line\n\nSecond line')
    expect(container.querySelector('figure')?.getAttribute('data-state')).toBe('copied')
  })

  it('preserves links and text selection', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    await render('Prompt', <a href="#target">Link</a>)

    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-v-prompt-toggle]')?.click(),
    )
    await act(async () => container.querySelector('a')?.click())
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false } as Selection)
    await act(async () => container.querySelector('pre')?.click())

    expect(writeText).not.toHaveBeenCalled()
  })

  it('reports rejected copies', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    await render('Prompt')

    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-v-prompt-copy]')?.click(),
    )

    expect(container.querySelector('[data-v-prompt-copy]')?.getAttribute('data-state')).toBe(
      'error',
    )
  })

  it('reports unavailable clipboard access', async () => {
    setClipboard(undefined)
    await render('Prompt')

    await act(async () =>
      container.querySelector<HTMLButtonElement>('[data-v-prompt-copy]')?.click(),
    )

    expect(container.querySelector('[data-v-prompt-copy]')?.getAttribute('data-state')).toBe(
      'error',
    )
  })
})

async function render(value: string, children: React.ReactNode = value) {
  await act(async () => root.render(<PromptFrame value={value}>{children}</PromptFrame>))
}

function setClipboard(clipboard: Pick<Clipboard, 'writeText'> | undefined) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard })
}
