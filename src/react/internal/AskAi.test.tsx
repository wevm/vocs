/** @vitest-environment jsdom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type * as Config from '../../internal/config.js'
import { AskAi } from './AskAi.js'

const mocks = vi.hoisted(() => ({
  config: {} as Config.Config,
  path: '/docs/intro',
}))

vi.mock('waku', () => ({
  useRouter: () => ({ path: mocks.path }),
}))

vi.mock('virtual:vocs/config', () => ({
  get config() {
    return mocks.config
  },
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  mocks.config = {} as Config.Config
  mocks.path = '/docs/intro'
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

test('shows Open in ChatGPT and Claude by default', async () => {
  await act(async () => root.render(<AskAi />))
  await openMenu()

  expect(document.querySelector('[data-v-ask-ai-open-in]')).not.toBeNull()
  expect(document.body.textContent).toContain('ChatGPT')
  expect(document.body.textContent).toContain('Claude')
  expect(document.body.textContent).toContain('Copy page for AI')
})

test('hides Open in ChatGPT and Claude when askAi.openIn is false', async () => {
  mocks.config = { askAi: { openIn: false } } as Config.Config
  await act(async () => root.render(<AskAi />))
  await openMenu()

  expect(document.querySelector('[data-v-ask-ai-open-in]')).toBeNull()
  expect(document.body.textContent).not.toContain('ChatGPT')
  expect(document.body.textContent).not.toContain('Claude')
  expect(document.body.textContent).toContain('Copy page for AI')
  expect(document.body.textContent).toContain('View as Markdown')
})

async function openMenu() {
  const trigger = container.querySelector<HTMLElement>('[data-v-ask-ai]')
  expect(trigger).not.toBeNull()
  await act(async () => trigger?.click())
}
