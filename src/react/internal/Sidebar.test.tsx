/** @vitest-environment jsdom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type * as Sidebar_core from '../../internal/sidebar.js'
import { Sidebar } from './Sidebar.js'

const mocks = vi.hoisted(() => ({
  path: '/docs',
  sidebar: { items: [] } as Sidebar_core.Sidebar,
}))

vi.mock('waku', () => ({
  useRouter: () => ({ path: mocks.path }),
}))

vi.mock('../useSidebar.js', () => ({
  useSidebar: () => mocks.sidebar,
}))

type ObserverEntry = Pick<IntersectionObserverEntry, 'isIntersecting' | 'target'>

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = []

  readonly observed = new Set<Element>()
  readonly callback: IntersectionObserverCallback
  readonly disconnect = vi.fn(() => this.observed.clear())

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    IntersectionObserverMock.instances.push(this)
  }

  observe = vi.fn((element: Element) => this.observed.add(element))

  emit(element: Element, isIntersecting = true) {
    const entry: ObserverEntry = { isIntersecting, target: element }
    this.callback([entry as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }

  unobserve = vi.fn((element: Element) => this.observed.delete(element))
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = '0px 0px -80% 0px'
  scrollMargin = '0px'
  thresholds = [0]
}

class MutationObserverMock {
  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn(() => [])
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  IntersectionObserverMock.instances = []
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  vi.stubGlobal('MutationObserver', MutationObserverMock)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 0
  })
  mocks.path = '/docs'
  mocks.sidebar = sidebar([
    { link: '/docs', text: 'Overview' },
    { link: '/docs#installation', text: 'Installation' },
    { link: '/docs#configuration', text: 'Configuration' },
    { link: '/docs#api', text: 'API' },
  ])
  window.history.replaceState(null, '', '/docs')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Sidebar in-page anchors', () => {
  test('observes only headings represented in the sidebar', async () => {
    addMarkdownHeadings([
      ['h2', 'installation'],
      ['h3', 'configuration'],
      ['h3', 'configuration-options'],
      ['h2', 'api'],
      ['h3', 'mcp-tools'],
    ])

    await renderSidebar()

    expect(observedIds()).toEqual(['installation', 'configuration', 'api'])
  })

  test('keeps the parent section active across unlinked nested headings', async () => {
    addMarkdownHeadings([
      ['h2', 'installation'],
      ['h3', 'configuration'],
      ['h3', 'configuration-options'],
      ['h2', 'api'],
      ['h3', 'mcp-tools'],
    ])
    await renderSidebar()
    const observer = activeObserver()

    await act(async () => observer.emit(element('configuration')))
    expect(activeItem()).toBe('Configuration')
    expect(observer.observed.has(element('configuration-options'))).toBe(false)
    expect(activeItem()).toBe('Configuration')

    await act(async () => observer.emit(element('api')))
    expect(activeItem()).toBe('API')
    expect(observer.observed.has(element('mcp-tools'))).toBe(false)
    expect(activeItem()).toBe('API')
  })

  test('switches active state between linked sections', async () => {
    addMarkdownHeadings([
      ['h2', 'installation'],
      ['h3', 'configuration'],
      ['h2', 'api'],
    ])
    await renderSidebar()
    const observer = activeObserver()

    expect(activeItem()).toBe('Overview')
    await act(async () => observer.emit(element('installation')))
    expect(activeItem()).toBe('Installation')
    await act(async () => observer.emit(element('configuration')))
    expect(activeItem()).toBe('Configuration')
    await act(async () => observer.emit(element('api')))
    expect(activeItem()).toBe('API')
  })

  test('activates the nearest parent for a nested markdown deep link', async () => {
    mocks.path = '/docs#mcp-tools'
    window.history.replaceState(null, '', '/docs#mcp-tools')
    addMarkdownHeadings([
      ['h2', 'installation'],
      ['h3', 'configuration'],
      ['h2', 'api'],
      ['h3', 'mcp-tools'],
    ])

    await renderSidebar()

    expect(activeItem()).toBe('API')
  })

  test('activates the preceding operation for an OpenAPI subheading deep link', async () => {
    mocks.path = '/api#list-pets-parameters'
    mocks.sidebar = sidebar([
      { link: '/api', text: 'Overview' },
      { link: '/api#list-pets', text: 'List pets' },
      { link: '/api#create-pet', text: 'Create pet' },
    ])
    window.history.replaceState(null, '', '/api#list-pets-parameters')
    const openApi = document.createElement('div')
    openApi.dataset['vOpenapi'] = ''
    openApi.innerHTML = `
      <h1 data-v-openapi-h1 id="api">API</h1>
      <h2 data-v-openapi-operation-title id="list-pets">List pets</h2>
      <h3 id="list-pets-parameters">Parameters</h3>
      <h2 data-v-openapi-operation-title id="create-pet">Create pet</h2>
    `
    document.body.append(openApi)

    await renderSidebar()

    expect(activeItem()).toBe('List pets')
    expect(observedIds()).toEqual(['list-pets', 'create-pet'])
  })

  test('keeps a guide page active when its headings are not sidebar anchors', async () => {
    mocks.path = '/guide'
    mocks.sidebar = sidebar([
      { link: '/guide', text: 'Guide' },
      { link: '/api#list-pets', text: 'List pets' },
    ])
    window.history.replaceState(null, '', '/guide')
    addMarkdownHeadings([
      ['h2', 'introduction'],
      ['h2', 'list-pets'],
      ['h2', 'examples'],
    ])

    await renderSidebar()

    expect(activeItem()).toBe('Guide')
    expect(IntersectionObserverMock.instances).toHaveLength(0)
  })
})

function sidebar(items: Sidebar_core.SidebarItem[]): Sidebar_core.Sidebar {
  return { items: [{ items, text: 'Documentation' }] }
}

function addMarkdownHeadings(headings: [tag: string, id: string][]) {
  const article = document.createElement('article')
  article.dataset['vContent'] = ''
  for (const [tag, id] of headings) {
    const heading = document.createElement(tag)
    heading.id = id
    article.append(heading)
  }
  document.body.append(article)
}

async function renderSidebar() {
  await act(async () => root.render(<Sidebar scrollRef={{ current: null }} />))
}

function activeObserver() {
  const observer = IntersectionObserverMock.instances[0]
  if (!observer) throw new Error('expected an IntersectionObserver')
  return observer
}

function observedIds() {
  return [...activeObserver().observed].map((item) => item.id)
}

function element(id: string) {
  const item = document.getElementById(id)
  if (!item) throw new Error(`expected #${id}`)
  return item
}

function activeItem() {
  return container.querySelector('[data-v-sidebar-item][data-active]')?.textContent
}
