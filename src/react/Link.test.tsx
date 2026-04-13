import { describe, expect, test, vi } from 'vitest'

vi.mock('waku', () => ({
  Link: (props: Record<string, unknown>) => ({ props, type: 'waku-link' }),
  useRouter: () => ({ path: '/guide/payments' }),
}))

import { Link } from './Link.js'

describe('Link', () => {
  test('maps prefetch="view" to prefetch on view', () => {
    const element = Link({
      children: null,
      prefetch: 'view',
      to: '/guide/payments/send-a-payment',
    })

    expect(element.props.to).toBe('/guide/payments/send-a-payment')
    expect(element.props.unstable_prefetchOnEnter).toBe(false)
    expect(element.props.unstable_prefetchOnView).toBe(true)
  })

  test('maps prefetch="intent" to prefetch on enter', () => {
    const element = Link({
      children: null,
      prefetch: 'intent',
      to: '/guide/payments/send-a-payment',
    })

    expect(element.props.unstable_prefetchOnEnter).toBe(true)
    expect(element.props.unstable_prefetchOnView).toBe(false)
  })

  test('disables prefetch when prefetch="none"', () => {
    const element = Link({
      children: null,
      prefetch: 'none',
      to: '/guide/payments/send-a-payment',
    })

    expect(element.props.unstable_prefetchOnEnter).toBe(false)
    expect(element.props.unstable_prefetchOnView).toBe(false)
  })

  test('renders external links without Waku prefetch props', () => {
    const element = Link({
      children: null,
      prefetch: 'view',
      to: 'https://tempo.xyz',
    })

    expect(element.type).toBe('a')
    expect(element.props.href).toBe('https://tempo.xyz')
    expect(element.props.unstable_prefetchOnEnter).toBeUndefined()
    expect(element.props.unstable_prefetchOnView).toBeUndefined()
  })
})
