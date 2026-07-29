/** @vitest-environment jsdom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { revealAnchor } from './anchor-navigation.client.js'
import { Schema } from './Schema.js'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  HTMLElement.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

test('materializes nested properties when their disclosure opens', async () => {
  await act(async () =>
    root.render(
      <Schema
        schema={{
          type: 'object',
          properties: {
            owner: {
              type: 'object',
              properties: { name: { type: 'string', description: 'Owner name' } },
            },
          },
        }}
      />,
    ),
  )

  expect(container.textContent).not.toContain('Owner name')
  const trigger = container.querySelector<HTMLButtonElement>('[data-v-openapi-disclosure-trigger]')
  await act(async () => trigger?.click())
  expect(container.textContent).toContain('Owner name')
  await act(async () => trigger?.click())
  expect(container.textContent).toContain('Owner name')
})

test('materializes the matching union variant for anchor navigation', async () => {
  await act(async () =>
    root.render(
      <Schema
        idBase="response"
        schema={{
          oneOf: [
            {
              title: 'First',
              type: 'object',
              properties: { first: { type: 'string' } },
            },
            {
              title: 'Second',
              type: 'object',
              properties: { second: { type: 'string', description: 'Second detail' } },
            },
          ],
        }}
      />,
    ),
  )

  expect(container.textContent).not.toContain('Second detail')
  let result: Promise<boolean> | undefined
  await act(async () => {
    result = revealAnchor('response-variant-1-second', { behavior: 'auto' })
  })
  expect(await result).toBe(true)
  expect(container.textContent).toContain('Second detail')
})

test('matches lazy anchors to the exact media schema', async () => {
  const nestedSchema = (description: string) => ({
    type: 'object',
    properties: {
      payload: {
        type: 'object',
        properties: { value: { type: 'string', description } },
      },
    },
  })

  await act(async () =>
    root.render(
      <>
        <Schema idBase="response-application-json" schema={nestedSchema('JSON response detail')} />
        <Schema
          idBase="response-application-json-patch-json"
          schema={nestedSchema('JSON Patch response detail')}
        />
      </>,
    ),
  )

  expect(container.textContent).not.toContain('JSON Patch response detail')
  let result: Promise<boolean> | undefined
  await act(async () => {
    result = revealAnchor('response-application-json-patch-json-payload-value', {
      behavior: 'auto',
    })
  })
  expect(await result).toBe(true)
  expect(container.textContent).toContain('JSON Patch response detail')
  expect(container.textContent).not.toContain('JSON response detail')
})
