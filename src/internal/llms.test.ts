import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, test } from 'vitest'
import { buildLlmsContent } from './llms.js'
import {
  remarkDefaultFrontmatter,
  remarkExtractFrontmatter,
  remarkFrontmatter,
  remarkStripFrontmatter,
  remarkStripInlineCache,
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
    remarkStripInlineCache,
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

  test('pages follow sidebar order when provided', async () => {
    const result = await buildLlmsContent({
      pages: [
        { path: '/reference/site-config', content: '---\ntitle: Site Config\n---\n\nConfig.' },
        { path: '/guide/getting-started', content: '---\ntitle: Getting Started\n---\n\nStart.' },
        { path: '/guide/what-is-vocs', content: '---\ntitle: What is Vocs\n---\n\nIntro.' },
        { path: '/guide/markdown', content: '---\ntitle: Markdown\n---\n\nMarkdown.' },
      ],
      sidebar: [
        { text: 'What is Vocs', link: '/guide/what-is-vocs' },
        { text: 'Getting Started', link: '/guide/getting-started' },
        {
          text: 'Writing',
          items: [{ text: 'Markdown', link: '/guide/markdown' }],
        },
        {
          text: 'API',
          items: [{ text: 'Site Config', link: '/reference/site-config' }],
        },
      ],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [What is Vocs](/guide/what-is-vocs)
      - [Getting Started](/guide/getting-started)
      - [Markdown](/guide/markdown)
      - [Site Config](/reference/site-config)"
    `)
  })

  test('path-scoped sidebars are flattened in config order', async () => {
    const result = await buildLlmsContent({
      pages: [
        { path: '/reference/components', content: '---\ntitle: Components\n---\n\nComponents.' },
        { path: '/guide/theming', content: '---\ntitle: Theming\n---\n\nTheming.' },
        { path: '/guide/structure', content: '---\ntitle: Structure\n---\n\nStructure.' },
      ],
      sidebar: {
        '/guide': {
          items: [
            { text: 'Structure', link: '/guide/structure' },
            { text: 'Theming', link: '/guide/theming' },
          ],
        },
        '/reference': [{ text: 'Components', link: '/reference/components' }],
      },
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [Structure](/guide/structure)
      - [Theming](/guide/theming)
      - [Components](/reference/components)"
    `)
  })

  test('unlisted pages sort after sidebar pages', async () => {
    const result = await buildLlmsContent({
      pages: [
        { path: '/zebra', content: '---\ntitle: Zebra\n---\n\nZebra.' },
        { path: '/guide/getting-started', content: '---\ntitle: Getting Started\n---\n\nStart.' },
        { path: '/about', content: '---\ntitle: About\n---\n\nAbout.' },
      ],
      sidebar: [{ text: 'Getting Started', link: '/guide/getting-started' }],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [Getting Started](/guide/getting-started)
      - [About](/about)
      - [Zebra](/zebra)"
    `)
  })

  test('external sidebar links are ignored', async () => {
    const result = await buildLlmsContent({
      pages: [
        { path: '/guide/getting-started', content: '---\ntitle: Getting Started\n---\n\nStart.' },
        { path: '/guide/what-is-vocs', content: '---\ntitle: What is Vocs\n---\n\nIntro.' },
      ],
      sidebar: [
        { text: 'GitHub', link: 'https://github.com/wevm/vocs' },
        { text: 'Getting Started', link: '/guide/getting-started' },
      ],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.short).toMatchInlineSnapshot(`
      "# My Docs

      - [Getting Started](/guide/getting-started)
      - [What is Vocs](/guide/what-is-vocs)"
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
    expect(result.results[0]?.content).toMatchInlineSnapshot(`
      "Content.
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

  test('strips inline twoslash cache comments from code blocks', async () => {
    const result = await buildLlmsContent({
      pages: [
        {
          path: '/code',
          content: `---
title: Code
---

\`\`\`ts
// @twoslash-cache: {"v":1,"hash":"abc","data":"xyz"}
const a = 1
\`\`\``,
        },
      ],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.results[0]?.content).toMatchInlineSnapshot(`
      "\`\`\`ts
      const a = 1
      \`\`\`
      "
    `)
  })

  test('includes imported markdown content for file-backed pages', async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-llms-'))
    const pagesDir = path.join(rootDir, 'src/pages')
    fs.mkdirSync(pagesDir, { recursive: true })

    const externalPath = path.join(rootDir, 'notes.md')
    const pagePath = path.join(pagesDir, 'notes.mdx')
    fs.writeFileSync(
      externalPath,
      '# Notes\n\nSome indexable prose about widgets. See [the docs](https://example.com).',
    )
    fs.writeFileSync(
      pagePath,
      `---
title: Notes
---

import Notes from '../../notes.md'

<Notes />`,
    )

    const result = await buildLlmsContent({
      pages: [{ path: '/notes', content: { path: pagePath } }],
      title: 'My Docs',
      ...plugins,
    })

    expect(result.results[0]?.content).toContain('Some indexable prose about widgets.')
    expect(result.full).toContain('Some indexable prose about widgets.')
  })
})
