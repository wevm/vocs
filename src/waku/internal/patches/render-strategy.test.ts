import { describe, expect, it } from 'vitest'
import { getDefaultRouteRender } from './render-strategy.js'

describe('getDefaultRouteRender', () => {
  it('uses dynamic routes for dynamic rendering', () => {
    expect(getDefaultRouteRender('dynamic')).toBe('dynamic')
  })

  it('uses static routes for static rendering strategies', () => {
    expect(getDefaultRouteRender('partial-static')).toBe('static')
    expect(getDefaultRouteRender('full-static')).toBe('static')
  })
})
