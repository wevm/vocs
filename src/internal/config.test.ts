import { describe, expect, test } from 'vitest'
import * as Config from './config.js'

describe('define', () => {
  test('leaves logoUrl and iconUrl untouched without a base path', () => {
    const config = Config.define({ iconUrl: '/icon.svg', logoUrl: '/logo.svg' })
    expect({ iconUrl: config.iconUrl, logoUrl: config.logoUrl }).toMatchInlineSnapshot(`
      {
        "iconUrl": "/icon.svg",
        "logoUrl": "/logo.svg",
      }
    `)
  })

  test('serves logoUrl and iconUrl from under the base path', () => {
    const config = Config.define({
      basePath: '/docs',
      iconUrl: '/icon.svg',
      logoUrl: { light: '/logo-light.svg', dark: 'https://example.com/logo-dark.svg' },
    })
    expect({ iconUrl: config.iconUrl, logoUrl: config.logoUrl }).toMatchInlineSnapshot(`
      {
        "iconUrl": "/docs/icon.svg",
        "logoUrl": {
          "dark": "https://example.com/logo-dark.svg",
          "light": "/docs/logo-light.svg",
        },
      }
    `)
  })

  test('does not prefix urls twice', () => {
    const once = Config.define({
      basePath: '/docs',
      iconUrl: '/docs/icon.svg',
      logoUrl: '/logo.svg',
    })
    const config = Config.define({
      basePath: once.basePath,
      iconUrl: once.iconUrl,
      logoUrl: once.logoUrl,
    })
    expect({ iconUrl: config.iconUrl, logoUrl: config.logoUrl }).toMatchInlineSnapshot(`
      {
        "iconUrl": "/docs/icon.svg",
        "logoUrl": "/docs/logo.svg",
      }
    `)
  })
})
