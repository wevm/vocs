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
  useRouter: () => ({ hash: '', path: mocks.path }),
}))

vi.mock('../useSidebar.js', () => ({
  useSidebar: () => mocks.sidebar,
}))

class ObserverMock {
  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn(() => [])
  unobserve = vi.fn()
}

/** Viewport `top` of each element by id. Elements without one are not rendered. */
let tops: Record<string, number>
let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  tops = {}
  vi.stubGlobal('MutationObserver', ObserverMock)
  vi.stubGlobal('ResizeObserver', ObserverMock)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 0
  })
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const top = tops[this.id] ?? 0
    return {
      bottom: top + 20,
      height: 20,
      left: 0,
      right: 0,
      top,
      width: 0,
      x: 0,
      y: top,
    } as DOMRect
  })
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return (this.id in tops ? [this.getBoundingClientRect()] : []) as unknown as DOMRectList
  })
  mocks.path = '/docs'
  mocks.sidebar = sidebar([
    { link: '/docs', text: 'Overview' },
    { link: '/docs#installation', text: 'Installation' },
    { link: '/docs#configuration', text: 'Configuration' },
    { link: '/docs#api', text: 'API' },
  ])
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
  test('activates the page item above the first linked section', async () => {
    addMarkdownHeadings({ installation: 100, configuration: 300, api: 600 })
    await renderSidebar()
    expect(activeItem()).toBe('Overview')
  })

  test('activates the last linked section that reached the top', async () => {
    addMarkdownHeadings({ installation: 100, configuration: 300, api: 600 })
    await renderSidebar()

    await scrollTo({ installation: 0, configuration: 200, api: 500 })
    expect(activeItem()).toBe('Installation')
    await scrollTo({ installation: -200, configuration: 0, api: 300 })
    expect(activeItem()).toBe('Configuration')
    await scrollTo({ installation: -500, configuration: -300, api: 0 })
    expect(activeItem()).toBe('API')
  })

  test('follows the reader when scrolling back up', async () => {
    addMarkdownHeadings({ installation: -500, configuration: -300, api: 0 })
    await renderSidebar()
    expect(activeItem()).toBe('API')

    // The API heading is below the top again, so its preceding section is read.
    await scrollTo({ installation: -400, configuration: -200, api: 100 })
    expect(activeItem()).toBe('Configuration')
    await scrollTo({ installation: 100, configuration: 300, api: 600 })
    expect(activeItem()).toBe('Overview')
  })

  test('activates the right section after jumping over several', async () => {
    addMarkdownHeadings({ installation: 100, configuration: 300, api: 600 })
    await renderSidebar()

    await scrollTo({ installation: -1000, configuration: -800, api: -10 })
    expect(activeItem()).toBe('API')
  })

  test('keeps the parent section active across unlinked nested headings', async () => {
    addMarkdownHeadings({
      installation: -400,
      configuration: -100,
      'configuration-options': 0,
      api: 300,
      'mcp-tools': 500,
    })
    await renderSidebar()
    expect(activeItem()).toBe('Configuration')

    await scrollTo({ installation: -900, configuration: -600, api: -200, 'mcp-tools': 0 })
    expect(activeItem()).toBe('API')
  })

  test('activates the preceding operation within an OpenAPI operation', async () => {
    mocks.path = '/api'
    mocks.sidebar = sidebar([
      { link: '/api', text: 'Overview' },
      { link: '/api#list-pets', text: 'List pets' },
      { link: '/api#create-pet', text: 'Create pet' },
    ])
    const openApi = document.createElement('div')
    openApi.dataset['vOpenapi'] = ''
    openApi.innerHTML = `
      <h1 data-v-openapi-h1 id="api">API</h1>
      <h2 data-v-openapi-operation-title id="list-pets">List pets</h2>
      <h3 id="list-pets-parameters">Parameters</h3>
      <h2 data-v-openapi-operation-title id="create-pet">Create pet</h2>
    `
    document.body.append(openApi)
    tops = { api: -300, 'list-pets': -40, 'list-pets-parameters': 0, 'create-pet': 400 }

    await renderSidebar()

    expect(activeItem()).toBe('List pets')
  })

  test('keeps a guide page active when its headings are not sidebar anchors', async () => {
    mocks.path = '/guide'
    mocks.sidebar = sidebar([
      { link: '/guide', text: 'Guide' },
      { link: '/api#list-pets', text: 'List pets' },
    ])
    addMarkdownHeadings({ introduction: -400, 'list-pets': -200, examples: 0 })

    await renderSidebar()

    expect(activeItem()).toBe('Guide')
  })

  test('activates hash links only for the current page', async () => {
    mocks.sidebar = sidebar([
      { link: '/docs', text: 'Overview' },
      { link: '/docs#api', text: 'API' },
      { link: '/other#api', text: 'Other API' },
    ])
    addMarkdownHeadings({ api: 0 })

    await renderSidebar()

    expect(activeItems()).toEqual(['API'])
  })

  test('ignores linked ids inside changelog release bodies', async () => {
    addMarkdownHeadings({ installation: -200, configuration: 300 })
    const changelog = document.createElement('div')
    changelog.dataset['vChangelog'] = ''
    changelog.innerHTML = '<h3 id="api">API</h3>'
    document.querySelector('article')?.append(changelog)
    tops['api'] = 0

    await renderSidebar()

    expect(activeItem()).toBe('Installation')
  })

  test('ignores hidden linked headings', async () => {
    addMarkdownHeadings({ installation: -200, configuration: 300 })
    // Rendered without layout boxes, e.g. inside a collapsed tab.
    document.querySelector('article')?.append(heading('h2', 'api'))

    await renderSidebar()

    expect(activeItem()).toBe('Installation')
  })

  test('matches percent-encoded fragments', async () => {
    mocks.sidebar = sidebar([
      { link: '/docs', text: 'Overview' },
      { link: '/docs#caf%C3%A9', text: 'Café' },
    ])
    addMarkdownHeadings({ café: 0 })

    await renderSidebar()

    expect(activeItem()).toBe('Café')
  })

  test('activates a short final section at the bottom of the page', async () => {
    addMarkdownHeadings({ installation: -600, configuration: -100, api: 400 })
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1000)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1000 + innerHeight)

    await renderSidebar()

    expect(activeItem()).toBe('API')
  })

  test('marks the current page and section with aria-current', async () => {
    addMarkdownHeadings({ installation: 100 })
    await renderSidebar()
    expect(link('Overview').getAttribute('aria-current')).toBe('page')
    expect(link('Installation').hasAttribute('aria-current')).toBe(false)

    await scrollTo({ installation: 0 })
    expect(link('Overview').hasAttribute('aria-current')).toBe(false)
    expect(link('Installation').getAttribute('aria-current')).toBe('location')
  })
})

function sidebar(items: Sidebar_core.SidebarItem[]): Sidebar_core.Sidebar {
  return { items: [{ items, text: 'Documentation' }] }
}

function heading(tag: string, id: string) {
  const element = document.createElement(tag)
  element.id = id
  return element
}

function addMarkdownHeadings(positions: Record<string, number>) {
  const article = document.createElement('article')
  article.dataset['vContent'] = ''
  for (const id of Object.keys(positions)) article.append(heading('h2', id))
  document.body.append(article)
  tops = { ...tops, ...positions }
}

async function renderSidebar() {
  await act(async () => root.render(<Sidebar scrollRef={{ current: null }} />))
}

async function scrollTo(positions: Record<string, number>) {
  tops = { ...tops, ...positions }
  await act(async () => window.dispatchEvent(new Event('scroll')))
}

function activeItems() {
  return [...container.querySelectorAll('[data-v-sidebar-item][data-active]')].map(
    (item) => item.textContent,
  )
}

function activeItem() {
  return activeItems()[0]
}

function link(text: string) {
  const item = [...container.querySelectorAll('[data-v-sidebar-item]')].find(
    (item) => item.textContent === text,
  )
  if (!item) throw new Error(`expected sidebar item ${text}`)
  return item
}
