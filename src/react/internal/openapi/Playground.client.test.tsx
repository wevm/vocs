/** @vitest-environment jsdom */

import { clients } from 'virtual:vocs/openapi-client'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Ir } from '../../../internal/openapi/parser.js'
import * as Auth from './auth.js'
import { PlaygroundProvider, TestRequestButton } from './Playground.client.js'
import { createWorkspaceStore } from './playground-modal.client.js'

vi.mock('./playground-modal.client.js', () => ({
  createWorkspaceStore: vi.fn(() => ({
    addDocument: async () => {},
    auth: { export: () => ({}), load: vi.fn() },
  })),
  createApiClientModal: () => ({ app: { unmount: () => {} }, open: () => {} }),
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  vi.mocked(createWorkspaceStore).mockClear()
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  for (const mount of Object.keys(clients)) delete clients[mount]
  window.localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

test('resets loading when the OpenAPI mount changes', async () => {
  let resolveClient: ((client: Ir['client']) => void) | undefined
  clients['/first'] = () =>
    new Promise((resolve) => {
      resolveClient = resolve
    })
  clients['/second'] = async () => ({ url: 'https://example.com/second.json' })

  const render = (mount: string) =>
    root.render(
      <PlaygroundProvider mount={mount}>
        <TestRequestButton method="GET" path="/pets" />
      </PlaygroundProvider>,
    )

  await act(async () => render('/first'))
  const button = container.querySelector<HTMLButtonElement>('[data-v-openapi-test-request]')
  expect(button?.disabled).toBe(false)

  await act(async () => {
    button?.click()
    await Promise.resolve()
  })
  expect(button?.disabled).toBe(true)

  await act(async () => render('/second'))
  expect(button?.disabled).toBe(false)

  await act(async () => {
    resolveClient?.({ url: 'https://example.com/first.json' })
    await Promise.resolve()
  })
})

test('keeps auth updates connected to the current mount store', async () => {
  let resolveClient: ((client: Ir['client']) => void) | undefined
  clients['/first'] = () =>
    new Promise((resolve) => {
      resolveClient = resolve
    })
  clients['/second'] = async () => ({ url: 'https://example.com/second.json' })

  const render = (mount: string) =>
    root.render(
      <PlaygroundProvider mount={mount}>
        <TestRequestButton method="GET" path="/pets" />
      </PlaygroundProvider>,
    )

  await act(async () => render('/first'))
  const button = container.querySelector<HTMLButtonElement>('[data-v-openapi-test-request]')
  await act(async () => {
    button?.click()
    await Promise.resolve()
  })

  await act(async () => render('/second'))
  await act(async () => {
    button?.click()
    await Promise.resolve()
  })
  expect(createWorkspaceStore).toHaveBeenCalledTimes(1)
  const currentStore = vi.mocked(createWorkspaceStore).mock.results[0]?.value

  await act(async () => {
    resolveClient?.({ url: 'https://example.com/first.json' })
    await Promise.resolve()
  })
  Auth.write('/second', JSON.stringify({ token: 'current' }))

  expect(createWorkspaceStore).toHaveBeenCalledTimes(1)
  expect(currentStore?.auth.load).toHaveBeenCalledWith({ token: 'current' })
})
