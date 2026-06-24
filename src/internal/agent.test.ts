import { describe, expect, test } from 'vitest'
import { buildAgentManifest } from './agent.js'

describe('buildAgentManifest', () => {
  test('title only', () => {
    const manifest = buildAgentManifest({
      title: 'My Docs',
      siteUrl: 'https://example.com',
    })

    expect(manifest).toMatchInlineSnapshot(`
      {
        "name": "My Docs",
        "resources": {
          "llms": "https://example.com/llms.txt",
          "llmsFull": "https://example.com/llms-full.txt",
          "sitemap": "https://example.com/sitemap.xml",
        },
        "url": "https://example.com",
      }
    `)
  })

  test('with description', () => {
    const manifest = buildAgentManifest({
      title: 'My Docs',
      description: 'Docs for Agents & Humans',
      siteUrl: 'https://example.com',
    })

    expect(manifest.description).toBe('Docs for Agents & Humans')
  })

  test('omits description when absent', () => {
    const manifest = buildAgentManifest({
      title: 'My Docs',
      siteUrl: 'https://example.com',
    })

    expect('description' in manifest).toBe(false)
  })

  test('strips trailing slash from siteUrl', () => {
    const manifest = buildAgentManifest({
      title: 'My Docs',
      siteUrl: 'https://example.com/',
    })

    expect(manifest.url).toBe('https://example.com')
    expect(manifest.resources.llms).toBe('https://example.com/llms.txt')
  })

  test('builds absolute resource URLs under a base path', () => {
    const manifest = buildAgentManifest({
      title: 'My Docs',
      siteUrl: 'https://example.com/docs',
    })

    expect(manifest.resources).toEqual({
      llms: 'https://example.com/docs/llms.txt',
      llmsFull: 'https://example.com/docs/llms-full.txt',
      sitemap: 'https://example.com/docs/sitemap.xml',
    })
  })
})
