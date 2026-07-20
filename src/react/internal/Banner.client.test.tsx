/** @vitest-environment jsdom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type * as Config from '../../internal/config.js'
import { Banner } from './Banner.client.js'

const mocks = vi.hoisted(() => ({
  config: {} as Config.Config,
}))

vi.mock('virtual:vocs/config', () => ({
  get config() {
    return mocks.config
  },
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  localStorage.clear()
  mocks.config = {
    banner: {
      content: 'A banner that can wrap onto multiple lines.',
      dismissable: false,
      height: '30px',
    },
  } as Config.Config
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.documentElement.style.removeProperty('--vocs-spacing-banner')
  vi.restoreAllMocks()
})

test('uses the configured height as a minimum', async () => {
  await act(async () => root.render(<Banner />))

  const banner = container.querySelector<HTMLElement>('[data-v-banner]')
  expect(banner?.style.minHeight).toBe('30px')
  expect(banner?.style.height).toBe('')
})
