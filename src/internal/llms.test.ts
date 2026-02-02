import { describe, expect, test } from 'vitest'
import { buildLlmsContent } from './llms.js'
import {
  remarkDefaultFrontmatter,
  remarkExtractFrontmatter,
  remarkFrontmatter,
  remarkStripFrontmatter,
  remarkStripJs,
} from './mdx.js'

const plugins = {
  rehypePlugins: [],
  remarkPlugins: [
    remarkFrontmatter,
    remarkDefaultFrontmatter,
    remarkExtractFrontmatter,
    remarkStripFrontmatter,
    remarkStripJs,
  ],
}

describe('buildLlmsContent', () => {
  test('empty pages', async () => {
    const result = await buildLlmsContent({
      pages: [],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs
      "
    `)
    expect(result.full).toMatchInlineSnapshot(`
      "# My Docs

      <!--
      Sitemap:
      -->
      "
    `)
  })

  test('single page with frontmatter', async () => {
    const result = await buildLlmsContent({
      pages: [
        {
          path: '/',
          content: `---
title: Home
description: Welcome to the docs
---

# Welcome

This is the home page.`,
        },
      ],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [Home](/index): Welcome to the docs"
    `)
    expect(result.full).toMatchInlineSnapshot(`
      "# My Docs

      <!--
      Sitemap:
      - [Home](/index): Welcome to the docs
      -->

      # Welcome

      This is the home page.
      "
    `)
  })

  test('pages without title are excluded', async () => {
    const result = await buildLlmsContent({
      pages: [
        { path: '/no-title', content: 'No heading, no frontmatter.' },
        { path: '/with-title', content: '---\ntitle: With Title\n---\n\nContent here.' },
      ],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [With Title](/with-title)"
    `)
    expect(result.full).toMatchInlineSnapshot(`
      "# My Docs

      <!--
      Sitemap:
      - [With Title](/with-title)
      -->

      Content here.
      "
    `)
  })

  test('h1 is used as title when no frontmatter', async () => {
    const result = await buildLlmsContent({
      pages: [{ path: '/page', content: '# My Page Title\n\nContent here.' }],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [My Page Title](/page)"
    `)
    expect(result.full).toMatchInlineSnapshot(`
      "# My Docs

      <!--
      Sitemap:
      - [My Page Title](/page)
      -->

      # My Page Title

      Content here.
      "
    `)
  })

  test('pages are sorted by depth then alphabetically', async () => {
    const result = await buildLlmsContent({
      pages: [
        {
          path: '/guide/getting-started',
          content: '---\ntitle: Getting Started\n---\n\nLearn the basics.',
        },
        { path: '/api/', content: '---\ntitle: API\n---\n\nAPI reference docs.' },
        { path: '/about', content: '---\ntitle: About\n---\n\nAbout this project.' },
        { path: '/', content: '---\ntitle: Home\n---\n\nWelcome home.' },
      ],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [Home](/index)
      - [About](/about)
      - [API](/api/)
      - [Getting Started](/guide/getting-started)"
    `)
    expect(result.full).toMatchInlineSnapshot(`
      "# My Docs

      <!--
      Sitemap:
      - [Home](/index)
      - [About](/about)
      - [API](/api/)
      - [Getting Started](/guide/getting-started)
      -->

      Welcome home.

      About this project.

      API reference docs.

      Learn the basics.
      "
    `)
  })

  test('index path uses /index in nav links', async () => {
    const result = await buildLlmsContent({
      pages: [{ path: '/', content: '---\ntitle: Home\n---\n\nThis is the homepage.' }],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [Home](/index)"
    `)
    expect(result.full).toMatchInlineSnapshot(`
      "# My Docs

      <!--
      Sitemap:
      - [Home](/index)
      -->

      This is the homepage.
      "
    `)
  })

  test('includes sitemap in page content', async () => {
    const result = await buildLlmsContent({
      pages: [{ path: '/page', content: '---\ntitle: Page\n---\n\nContent.' }],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [Page](/page)"
    `)
    expect(result.full).toMatchInlineSnapshot(`
      "# My Docs

      <!--
      Sitemap:
      - [Page](/page)
      -->

      Content.
      "
    `)
  })

  test('description is included in output when provided', async () => {
    const result = await buildLlmsContent({
      pages: [{ path: '/', content: '---\ntitle: Home\n---\n\nWelcome to the docs.' }],
      title: 'My Docs',
      description: 'A great documentation site',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      A great documentation site

      - [Home](/index)"
    `)
    expect(result.full).toMatchInlineSnapshot(`
      "# My Docs

      A great documentation site

      <!--
      Sitemap:
      - [Home](/index)
      -->

      Welcome to the docs.
      "
    `)
  })

  test('handles mdx content', async () => {
    const result = await buildLlmsContent({
      pages: [
        {
          path: '/component',
          content: `---
title: Component
---

<Component />`,
        },
      ],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [Component](/component)"
    `)
    expect(result.full).toMatchInlineSnapshot(`
      "# My Docs

      <!--
      Sitemap:
      - [Component](/component)
      -->

      <Component />
      "
    `)
  })
})
