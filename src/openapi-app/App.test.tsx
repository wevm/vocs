import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'
import type { Payload } from '../internal/openapi/app.js'
import { App } from './App.js'

const mocks = vi.hoisted(() => ({
  openApiPage: vi.fn((_props: { inlineSchemaModels?: boolean | undefined }) => null),
  path: '/api/pets',
}))

vi.mock('../react/internal/openapi/OpenApiPage.js', () => ({
  OpenApiGuide: () => null,
  OpenApiPage: mocks.openApiPage,
}))

vi.mock('./blocks.js', () => ({
  Blocks: () => null,
}))

vi.mock('./waku.js', () => ({
  RouterProvider: (props: { children: React.ReactNode }) => props.children,
  useRouter: () => ({ path: mocks.path }),
}))

beforeEach(() => {
  mocks.openApiPage.mockClear()
})

test('keeps standalone category schema models inline', () => {
  renderToStaticMarkup(<App payload={payload} />)

  expect(mocks.openApiPage.mock.calls[0]?.[0]).toMatchObject({
    group: 'pets',
    inlineSchemaModels: true,
    mount: '/api',
  })
})

const payload: Payload = {
  config: {} as Payload['config'],
  ir: {
    client: { content: {} },
    groups: [{ id: 'pets', name: 'Pets', operations: [] }],
    info: { title: 'Pet API' },
    path: '/api',
    securitySchemes: {},
    servers: [],
    traits: [],
  },
  pages: [],
  sidebar: [],
  title: 'Pet API',
}
