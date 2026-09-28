import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'
import { Main } from './Layout.client.js'

const mocks = vi.hoisted(() => ({
  links: [] as { to: string; unstable_prefetchOnView?: boolean }[],
}))

vi.mock('./Link.js', () => ({
  Link: (props: { to: string; unstable_prefetchOnView?: boolean }) => {
    mocks.links.push(props)
    return null
  },
}))

vi.mock('./internal/Banner.client.js', () => ({ Banner: () => null }))
vi.mock('./internal/MobileNav.js', () => ({ MobileNav: () => null }))
vi.mock('./internal/Search.js', () => ({ Search: () => null }))
vi.mock('./internal/Sidebar.js', () => ({ Sidebar: () => null }))
vi.mock('./internal/SkipToContent.client.js', () => ({ SkipToContent: () => null }))
vi.mock('./internal/Socials.client.js', () => ({ Socials: () => null }))
vi.mock('./internal/ThemeToggle.client.js', () => ({ ThemeToggle: () => null }))
vi.mock('./internal/TopNav.js', () => ({ TopNav: () => null }))
vi.mock('./useConfig.js', () => ({ useConfig: () => ({ colorScheme: 'light dark' }) }))
vi.mock('./useLayout.js', () => ({
  useLayout: () => ({
    contentWidth: 'full',
    layout: 'blank',
    showAskAi: false,
    showLogo: true,
    showOutline: false,
    showSearch: false,
    showSidebar: true,
    showTopNav: true,
  }),
}))
vi.mock('./useSlots.js', () => ({ useSlots: () => ({}) }))
vi.mock('./useTopGutterOffset.js', () => ({ useTopGutterRef: () => ({ current: null }) }))

beforeEach(() => {
  mocks.links = []
})

test('logo links do not prefetch when they enter the viewport', () => {
  renderToStaticMarkup(<Main>Content</Main>)

  expect(
    mocks.links.map(({ to, unstable_prefetchOnView }) => ({ to, unstable_prefetchOnView })),
  ).toEqual([
    { to: '/', unstable_prefetchOnView: false },
    { to: '/', unstable_prefetchOnView: false },
  ])
})
