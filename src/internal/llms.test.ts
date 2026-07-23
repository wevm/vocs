import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import remarkDirective from 'remark-directive'
import type { Pluggable } from 'unified'
import { describe, expect, test } from 'vitest'
import type * as Changelog from './changelog.js'
import * as Directive from './directive.js'
import { buildLlmsContent, getMarkdownPagePrelude } from './llms.js'
import {
  remarkDefaultFrontmatter,
  remarkDirectivesMarkdown,
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

  test('prepends guidance to page content without repeating it in llms-full.txt', async () => {
    const pagePrelude =
      "> **Can't find what you're looking for?** Use `search_docs` on the docs MCP server."
    const result = await buildLlmsContent({
      pages: [{ path: '/page', content: '---\ntitle: Page\n---\n\nContent.' }],
      pagePrelude,
      title: 'My Docs',
      ...plugins,
    })

    expect(result.results[0]?.content).toMatchInlineSnapshot(`
      "> **Can't find what you're looking for?** Use \`search_docs\` on the docs MCP server.

      Content.
      "
    `)
    expect(result.full).not.toContain(pagePrelude)
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

  const withDirectives = (directives: Directive.resolve.ReturnType) => ({
    rehypePlugins: [],
    remarkPlugins: [
      ...plugins.remarkPlugins,
      remarkDirective,
      [remarkDirectivesMarkdown, { directives }] as Pluggable,
    ],
  })

  describe('::changelog directive', () => {
    const releases: Changelog.Release[] = [
      {
        version: 'vocs@2.1.0',
        title: 'vocs@2.1.0',
        date: '2026-06-02T00:00:00.000Z',
        body: '### Patch Changes\n\n- Fixed a thing.',
        url: 'https://example.com/releases/2.1.0',
      },
      {
        version: 'vocs@2.0.0',
        title: 'Big Bang',
        date: '2026-05-01T00:00:00.000Z',
        body: '### Major Changes\n\n- Everything changed.',
        url: 'https://example.com/releases/2.0.0',
      },
      {
        version: 'vocs@1.9.0',
        title: 'vocs@1.9.0',
        date: '2026-04-01T00:00:00.000Z',
        body: '- Older release.',
        url: 'https://example.com/releases/1.9.0',
      },
    ]
    const adapter: Changelog.Adapter = {
      type: 'mock',
      async fetch(options = {}) {
        return releases.slice(0, options.limit ?? releases.length)
      },
    }
    const page = {
      path: '/changelog',
      content: '---\ntitle: Changelog\n---\n\n::changelog',
    }
    const withChangelog = (changelog?: Changelog.Adapter) =>
      withDirectives(Directive.resolve({ config: { changelog } }))

    test('renders releases from the adapter', async () => {
      const result = await buildLlmsContent({
        pages: [page],
        title: 'My Docs',
        ...withChangelog(adapter),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).not.toContain('::changelog')
      expect(content).toContain('## vocs@2.1.0 (2026-06-02)')
      expect(content).toContain('Fixed a thing.')
      // A title differing from the version is included in the heading.
      expect(content).toContain('## vocs@2.0.0 — Big Bang (2026-05-01)')
      expect(content).toContain('Everything changed.')
    })

    test('respects the limit attribute', async () => {
      const result = await buildLlmsContent({
        pages: [{ ...page, content: '---\ntitle: Changelog\n---\n\n::changelog{limit=1}' }],
        title: 'My Docs',
        ...withChangelog(adapter),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).toContain('## vocs@2.1.0 (2026-06-02)')
      expect(content).not.toContain('vocs@2.0.0')
    })

    test('falls back to the default on a malformed limit', async () => {
      const result = await buildLlmsContent({
        pages: [{ ...page, content: '---\ntitle: Changelog\n---\n\n::changelog{limit=abc}' }],
        title: 'My Docs',
        ...withChangelog(adapter),
      })

      // Behaves like no limit: all releases render.
      const content = result.results[0]?.content ?? ''
      expect(content).not.toContain('::changelog')
      expect(content).toContain('## vocs@2.1.0 (2026-06-02)')
      expect(content).toContain('## vocs@2.0.0 — Big Bang (2026-05-01)')
      expect(content).toContain('## vocs@1.9.0 (2026-04-01)')
    })

    test('replaces multiple directives on one page independently', async () => {
      const result = await buildLlmsContent({
        pages: [
          {
            path: '/changelog',
            content:
              '---\ntitle: Changelog\n---\n\n::changelog{limit=1}\n\nOlder releases:\n\n::changelog{limit=2}',
          },
        ],
        title: 'My Docs',
        ...withChangelog(adapter),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).not.toContain('::changelog')
      // First directive (limit=1): only the latest release.
      // Second directive (limit=2): latest two — so vocs@2.1.0 appears twice,
      // vocs@2.0.0 once, and the separator paragraph sits between them.
      expect(content.match(/## vocs@2\.1\.0/g)).toHaveLength(2)
      expect(content.match(/## vocs@2\.0\.0/g)).toHaveLength(1)
      const separator = content.indexOf('Older releases:')
      expect(separator).toBeGreaterThan(-1)
      expect(content.indexOf('## vocs@2.1.0')).toBeLessThan(separator)
      expect(content.lastIndexOf('## vocs@2.0.0')).toBeGreaterThan(separator)
    })

    test('degrades to a comment without an adapter', async () => {
      const result = await buildLlmsContent({
        pages: [page],
        title: 'My Docs',
        ...withChangelog(undefined),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).not.toContain('::changelog')
      expect(content).toContain('<!-- changelog unavailable -->')
    })

    test('degrades to a comment when the adapter throws', async () => {
      const throwing: Changelog.Adapter = {
        type: 'mock',
        async fetch() {
          throw new Error('rate limit exceeded')
        },
      }
      const result = await buildLlmsContent({
        pages: [page],
        title: 'My Docs',
        ...withChangelog(throwing),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).toContain('<!-- changelog unavailable -->')
    })

    test('unhandled directives round-trip unchanged', async () => {
      const result = await buildLlmsContent({
        pages: [
          {
            path: '/guide',
            content: '---\ntitle: Guide\n---\n\n:::steps\n### One\n\nDo the thing.\n:::',
          },
        ],
        title: 'My Docs',
        ...withChangelog(adapter),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).toContain(':::steps')
      expect(content).toContain('Do the thing.')
    })
  })

  describe('user directives', () => {
    const withUserDirectives = (directives: readonly Directive.Directive[]) =>
      withDirectives(Directive.resolve({ config: {}, directives }))

    const posts = [
      { title: 'Announcing Vocs v2', path: '/blog/announcing-v2', date: '2026-06-01' },
      { title: 'Reducing bundle size', path: '/blog/bundle-size', date: '2026-05-12' },
      { title: 'Hello world', path: '/blog/hello-world', date: '2026-04-02' },
    ]
    const blogPosts: Directive.Directive = {
      name: 'blog-posts',
      toMarkdown(attributes) {
        const limit = Number.parseInt(attributes['limit'] ?? '', 10) || posts.length
        return posts
          .slice(0, limit)
          .map((post) => `- [${post.title}](${post.path}) — ${post.date}`)
          .join('\n')
      },
    }

    const page = {
      path: '/blog',
      content: '---\ntitle: Blog\n---\n\n::blog-posts{limit=2}',
    }

    test('renders a post list from `toMarkdown`', async () => {
      const result = await buildLlmsContent({
        pages: [page],
        title: 'My Docs',
        ...withUserDirectives([blogPosts]),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).not.toContain('::blog-posts')
      expect(content).toContain('[Announcing Vocs v2](/blog/announcing-v2) — 2026-06-01')
      expect(content).toContain('[Reducing bundle size](/blog/bundle-size) — 2026-05-12')
      // limit=2: the third post is cut.
      expect(content).not.toContain('Hello world')
    })

    test('splices mdast nodes from `toMarkdown`', async () => {
      const result = await buildLlmsContent({
        pages: [{ path: '/blog', content: '---\ntitle: Blog\n---\n\n::authors' }],
        title: 'My Docs',
        ...withUserDirectives([
          {
            name: 'authors',
            toMarkdown: () => [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', value: 'Written by ' },
                  {
                    type: 'link',
                    url: 'https://github.com/jxom',
                    children: [{ type: 'text', value: 'jxom' }],
                  },
                ],
              },
            ],
          },
        ]),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).not.toContain('::authors')
      expect(content).toContain('Written by [jxom](https://github.com/jxom)')
    })

    test('leaves the directive as-is on `null`', async () => {
      const result = await buildLlmsContent({
        pages: [page],
        title: 'My Docs',
        ...withUserDirectives([{ name: 'blog-posts', toMarkdown: () => null }]),
      })

      // The directive round-trips to its source form (attributes normalized).
      expect(result.results[0]?.content).toContain('::blog-posts{limit="2"}')
    })

    test('degrades to a comment when `toMarkdown` throws', async () => {
      const result = await buildLlmsContent({
        pages: [page],
        title: 'My Docs',
        ...withUserDirectives([
          {
            name: 'blog-posts',
            toMarkdown() {
              throw new Error('failed to read posts')
            },
          },
        ]),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).not.toContain('::blog-posts')
      expect(content).toContain('<!-- blog-posts unavailable -->')
    })

    test('overrides a built-in of the same name', async () => {
      const result = await buildLlmsContent({
        pages: [{ path: '/changelog', content: '---\ntitle: Changelog\n---\n\n::changelog' }],
        title: 'My Docs',
        ...withUserDirectives([
          {
            name: 'changelog',
            toMarkdown: () =>
              'All releases live on [GitHub](https://github.com/wevm/vocs/releases).',
          },
        ]),
      })

      const content = result.results[0]?.content ?? ''
      expect(content).not.toContain('::changelog')
      expect(content).toContain('[GitHub](https://github.com/wevm/vocs/releases)')
    })
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

describe('getMarkdownPagePrelude', () => {
  test('links to the configured MCP endpoint and feedback tool', () => {
    const result = getMarkdownPagePrelude({
      basePath: '/developers',
      baseUrl: 'https://tempo.xyz',
      feedback: true,
      mcp: { enabled: true },
    })

    expect(result).toMatchInlineSnapshot(`
      "> **Can't find what you're looking for?** Use \`search_docs\` on the docs MCP server at \`https://tempo.xyz/developers/api/mcp\` to find what you need.
      >
      > **Have feedback?** Use \`submit_feedback\` on the same MCP server."
    `)
  })

  test('omits the prelude when MCP is disabled', () => {
    expect(
      getMarkdownPagePrelude({ basePath: '/', feedback: true, mcp: { enabled: false } }),
    ).toBeUndefined()
  })
})
