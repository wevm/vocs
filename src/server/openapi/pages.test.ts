import { describe, expect, test } from 'vitest'
import { compile, compileSource } from './pages.js'

describe('compile', () => {
  test('compiles inline content without filesystem access', async () => {
    const pages = await compile([{ path: '/auth', content: '# Authentication\n\nUse a token.' }])
    expect(pages).toHaveLength(1)
    expect(pages[0]?.path).toBe('/auth')
    expect(pages[0]?.title).toBe('Authentication')
    expect(pages[0]?.blocks[0]).toMatchObject({ type: 'html' })
  })

  test('applies a title override', async () => {
    const pages = await compile([{ path: '/auth', content: '# Heading', title: 'Custom' }])
    expect(pages[0]?.title).toBe('Custom')
  })

  test('throws when a page has neither file nor content', async () => {
    await expect(compile([{ path: '/auth' }])).rejects.toThrow(/either `file` or `content`/)
  })
})

describe('compileSource', () => {
  test('compiles markdown to an html block', () => {
    const page = compileSource('/auth', '# Authentication\n\nUse a token.')
    expect(page.path).toBe('/auth')
    expect(page.title).toBe('Authentication')
    expect(page.blocks).toHaveLength(1)
    expect(page.blocks[0]).toMatchObject({ type: 'html' })
    if (page.blocks[0]?.type === 'html') expect(page.blocks[0].html).toContain('Authentication')
  })

  test('reads title from frontmatter', () => {
    const page = compileSource('/', '---\ntitle: Overview\n---\n\nHello.')
    expect(page.title).toBe('Overview')
    expect(page.blocks).toHaveLength(1)
  })

  test('splits around <OpenApi.Endpoints /> into blocks', () => {
    const page = compileSource('/', 'Intro text.\n\n<OpenApi.Endpoints />\n\nMore text.')
    expect(page.blocks.map((block) => block.type)).toEqual(['html', 'endpoints', 'html'])
  })

  test('parses an Endpoints path attribute and strips esm imports', () => {
    const page = compileSource(
      '/',
      'import { OpenApi } from \'vocs\'\n\n<OpenApi.Endpoints path="/api" />',
    )
    const endpoints = page.blocks.find((block) => block.type === 'endpoints')
    expect(endpoints).toMatchObject({ type: 'endpoints', path: '/api' })
    // The import line is stripped (not rendered as prose).
    expect(page.blocks.some((b) => b.type === 'html' && b.html.includes('import'))).toBe(false)
  })

  test('normalizes the route path', () => {
    expect(compileSource('auth/', 'x').path).toBe('/auth')
  })
})
