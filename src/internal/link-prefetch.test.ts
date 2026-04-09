import { describe, expect, test } from 'vitest'
import { resolve, toWakuProps } from './link-prefetch.js'

describe('resolve', () => {
  test('supports global and scoped overrides', () => {
    expect([
      resolve({ config: false, fallbackMode: 'view' }),
      resolve({ config: { mode: false, topNav: 'enter' }, fallbackMode: 'view' }),
      resolve({
        config: { mode: false, topNav: 'enter' },
        fallbackMode: 'view',
        scope: 'topNav',
      }),
      resolve({
        config: { mode: false, sidebar: 'enter' },
        fallbackMode: 'view',
        routeConfig: { mode: 'view', sidebar: false },
        scope: 'sidebar',
      }),
      resolve({
        config: { mode: false, sidebar: 'enter' },
        fallbackMode: 'view',
        routeConfig: { mode: 'view', sidebar: false },
      }),
      resolve({
        config: { mode: false, topNav: 'enter' },
        fallbackMode: 'view',
        mode: true,
      }),
    ]).toMatchInlineSnapshot(`
      [
        false,
        false,
        "enter",
        false,
        "view",
        "view",
      ]
    `)
  })
})

describe('toWakuProps', () => {
  test('maps modes to Waku link props', () => {
    expect([toWakuProps(false), toWakuProps('enter'), toWakuProps('view')])
      .toMatchInlineSnapshot(`
        [
          {},
          {
            "unstable_prefetchOnEnter": true,
          },
          {
            "unstable_prefetchOnView": true,
          },
        ]
      `)
  })
})
