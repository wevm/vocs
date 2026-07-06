import * as path from 'node:path'
import type * as Estree from 'estree'
import type * as MdAst from 'mdast'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import ruby from 'shiki/langs/ruby.mjs'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'
import * as Config from './config.js'
import * as Directive from './directive.js'
import {
  deadLinks,
  getCompileOptions,
  recmaMdxLayout,
  rehypeHeadingAnchors,
  rehypeLinks,
  remarkCodeTitle,
  remarkDefaultFrontmatter,
  remarkDirectives,
  remarkFilename,
  remarkFileTree,
  remarkLangCommaAttrs,
  remarkPrompt,
  remarkRestoreUnknownTextDirectives,
  remarkSubheading,
} from './mdx.js'
import * as OpenApiRegistry from './openapi/registry.js'

type CodeNode = {
  type: 'code'
  lang?: string | undefined
  meta?: string | undefined
  value: string
}

type ContainerDirectiveNode = {
  type: 'containerDirective'
  name: string
  children: CodeNode[]
}

type Root = {
  type: 'root'
  children: Array<CodeNode | ContainerDirectiveNode>
}

type TransformCodeNodeOptions = {
  applyCommaAttrs?: boolean | undefined
}

function getCodeTitlePlugin(config: Config.Config) {
  const { remarkPlugins } = getCompileOptions('react', config)
  const codeTitlePlugin = remarkPlugins.find(
    (plugin): plugin is [typeof remarkCodeTitle, remarkCodeTitle.Options] =>
      Array.isArray(plugin) && plugin[0] === remarkCodeTitle,
  )

  expect(codeTitlePlugin).toBeDefined()
  if (!codeTitlePlugin) throw new Error('remarkCodeTitle plugin not found')

  return codeTitlePlugin[1]
}

function transformCodeNode(
  config: Config.Config,
  codeNode: Omit<CodeNode, 'type'>,
  options: TransformCodeNodeOptions = {},
) {
  const tree: Root = {
    type: 'root',
    children: [{ type: 'code', ...codeNode }],
  }

  if (options.applyCommaAttrs) remarkLangCommaAttrs()(tree as never)

  remarkCodeTitle(getCodeTitlePlugin(config))(tree as never)

  return tree.children[0] as CodeNode
}

describe('remarkDefaultFrontmatter', () => {
  it('infers title and description from heading subtext with inline code', async () => {
    const tree = await runRemark(
      '# Common Package [How `packages/common` is structured, why it exists]',
      [remarkDefaultFrontmatter],
    )
    const frontmatter = tree.children[0]

    expect(frontmatter).toMatchObject({
      type: 'yaml',
      value:
        'title: "Common Package"\ndescription: "How packages/common is structured, why it exists"',
    })
  })
})

describe('remarkSubheading', () => {
  it('extracts heading subtext with inline markdown nodes', async () => {
    const tree = await runRemark(
      [
        '---',
        'title: Test',
        '---',
        '',
        '# **Common** Package [How `packages/common` is *structured*]',
      ].join('\n'),
      [remarkFrontmatter, remarkSubheading],
    )
    const hgroup = tree.children[1] as MdAst.Paragraph
    const heading = hgroup.children[0] as unknown as MdAst.Heading
    const subheading = hgroup.children[1] as unknown as MdAst.Paragraph

    expect(stripPositions(heading.children)).toEqual([
      {
        type: 'strong',
        children: [{ type: 'text', value: 'Common' }],
      },
      { type: 'text', value: ' Package' },
    ])
    expect(stripPositions(subheading.children)).toEqual([
      { type: 'text', value: 'How ' },
      { type: 'inlineCode', value: 'packages/common' },
      { type: 'text', value: ' is ' },
      {
        type: 'emphasis',
        children: [{ type: 'text', value: 'structured' }],
      },
    ])
  })
})

describe('remarkPrompt', () => {
  it('turns prompt directives into opaque prompt blocks', async () => {
    const value = [
      'Read https://vocs.dev.',
      '',
      'Requirements:',
      '- Run `pnpm build`.',
      '- Replace <PROJECT_NAME>.',
      '- Preserve {literal} braces.',
    ].join('\n')
    const tree = await runRemark(`:::prompt\n${value}\n:::`, [remarkDirective, remarkPrompt])

    expect(tree.children[0]).toMatchObject({
      type: 'paragraph',
      children: [],
      data: {
        hName: 'pre',
        hProperties: { 'data-v-prompt': value },
      },
    })
  })

  it('leaves prompt examples in code fences unchanged', async () => {
    const value = ':::prompt\nReplace <PROJECT_NAME>.\n:::'
    const tree = await runRemark(`\`\`\`md\n${value}\n\`\`\``, [remarkDirective, remarkPrompt])

    expect(tree.children[0]).toMatchObject({ type: 'code', lang: 'md', value })
  })

  it('restores prompt directives as code blocks for markdown output', async () => {
    const value = 'Replace <PROJECT_NAME> and preserve {literal} braces.'
    const tree = await runRemark(`:::prompt\n${value}\n:::`, [
      remarkDirective,
      [remarkPrompt, { output: 'code' }],
    ])

    expect(tree.children[0]).toMatchObject({ type: 'code', lang: 'prompt', value })
  })

  it('leaves other directives unchanged', async () => {
    const tree = await runRemark(':::note\nhello\n:::', [remarkDirective, remarkPrompt])

    expect(tree.children[0]).toMatchObject({
      type: 'containerDirective',
      name: 'note',
    })
  })
})

async function runRemark(markdown: string, plugins: unknown[]) {
  const processor = unified().use(remarkParse)
  for (const plugin of plugins) {
    if (Array.isArray(plugin)) processor.use(plugin[0] as never, plugin[1] as never)
    else processor.use(plugin as never)
  }
  const tree = processor.parse(markdown) as MdAst.Root
  await processor.run(tree, markdown)
  return tree
}

function stripPositions(children: MdAst.PhrasingContent[]): unknown[] {
  return children.map(({ position: _, ...child }) => {
    if ('children' in child) return { ...child, children: stripPositions(child.children) }
    return child
  })
}

function createMdxProgram(): Estree.Program {
  return {
    type: 'Program',
    sourceType: 'module',
    body: [
      {
        type: 'ExportDefaultDeclaration',
        declaration: { type: 'Identifier', name: 'MDXContent' },
      },
    ],
  }
}

describe('recmaMdxLayout', () => {
  it('skips page layout injection for markdown outside the pages directory', () => {
    const rootDir = path.join(process.cwd(), 'playground')
    const tree = createMdxProgram()
    const transform = recmaMdxLayout(Config.define({ rootDir }))()

    transform(tree, {
      basename: 'notes.md',
      dirname: rootDir,
      path: path.join(rootDir, 'notes.md'),
    } as never)

    expect(tree).toEqual(createMdxProgram())
  })
})

describe('remarkFilename', () => {
  it('scopes duplicate code-group filenames to their group', () => {
    const firstExample = {
      type: 'code',
      lang: 'ts',
      meta: 'twoslash [example.ts]',
      value: "import { value } from './config'\nvalue",
    } satisfies CodeNode
    const secondExample = { ...firstExample }
    const tree = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'code-group',
          children: [
            firstExample,
            {
              type: 'code',
              lang: 'ts',
              meta: '[config.ts]',
              value: "export const value = 'one'",
            },
          ],
        },
        {
          type: 'containerDirective',
          name: 'code-group',
          children: [
            secondExample,
            {
              type: 'code',
              lang: 'ts',
              meta: '[config.ts]',
              value: "export const value = 'two'",
            },
          ],
        },
      ],
    } satisfies Root

    remarkFilename()(tree as never)

    expect(firstExample.value).toContain("export const value = 'one'")
    expect(firstExample.value).not.toContain("export const value = 'two'")
    expect(secondExample.value).toContain("export const value = 'two'")
    expect(secondExample.value).not.toContain("export const value = 'one'")
  })

  it('keeps document virtual files available to later snippets', () => {
    const laterExample = {
      type: 'code',
      lang: 'ts',
      meta: 'twoslash',
      value: "import { value } from './config'\nvalue",
    } satisfies CodeNode
    const tree = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'code-group',
          children: [
            {
              type: 'code',
              lang: 'ts',
              meta: '[config.ts]',
              value: "export const value = 'shared'",
            },
          ],
        },
        laterExample,
      ],
    } satisfies Root

    remarkFilename()(tree as never)

    expect(laterExample.value).toContain('// @filename: config.ts')
    expect(laterExample.value).toContain("export const value = 'shared'")
  })
})

describe('getCompileOptions', () => {
  it('preserves configured custom language fences', () => {
    const config = Config.define({
      codeHighlight: { langs: ruby },
      rootDir: process.cwd(),
    })

    const codeTitleOptions = getCodeTitlePlugin(config)

    expect(codeTitleOptions.additionalLanguages).toEqual(expect.arrayContaining(['rb', 'ruby']))

    const codeNode = transformCodeNode(config, {
      lang: 'ruby',
      meta: '[server.rb]',
      value: 'require "mpp"',
    })

    expect(codeNode.lang).toBe('ruby')
    expect(codeNode.meta).toBe('[server.rb]')
  })

  it('preserves custom language aliases', () => {
    const config = Config.define({
      codeHighlight: { langs: ruby },
      rootDir: process.cwd(),
    })

    const codeNode = transformCodeNode(config, {
      lang: 'rb',
      meta: '[client.rb]',
      value: 'require "mpp"',
    })

    expect(codeNode.lang).toBe('rb')
    expect(codeNode.meta).toBe('[client.rb]')
  })

  it('preserves built-in aliases with comma attrs', () => {
    const config = Config.define({ rootDir: process.cwd() })

    const codeNode = transformCodeNode(
      config,
      {
        lang: 'rs,no_run',
        meta: '[main.rs]',
        value: 'fn main() {}',
      },
      { applyCommaAttrs: true },
    )

    expect(codeNode.lang).toBe('rs')
    expect(codeNode.meta).toBe('[main.rs] no_run')
  })

  it('falls back unknown titled fences to plaintext', () => {
    const config = Config.define({ rootDir: process.cwd() })

    const codeNode = transformCodeNode(config, {
      lang: 'foobarlang',
      meta: '[sample.foo]',
      value: 'hello world',
    })

    expect(codeNode.lang).toBe('plaintext')
    expect(codeNode.meta).toBe('foobarlang')
  })

  it('keeps built-in titled fences unchanged', () => {
    const config = Config.define({ rootDir: process.cwd() })

    const codeNode = transformCodeNode(config, {
      lang: 'ts',
      meta: '[example.ts]',
      value: 'export const x = 1',
    })

    expect(codeNode.lang).toBe('ts')
    expect(codeNode.meta).toBe('[example.ts]')
  })

  it('threads user-configured remark plugins into the txt profile', () => {
    function userRemarkPlugin() {}
    const config = Config.define({
      markdown: { remarkPlugins: [userRemarkPlugin] },
      rootDir: process.cwd(),
    })

    expect(getCompileOptions('txt', config).remarkPlugins).toContain(userRemarkPlugin)
    expect(getCompileOptions('react', config).remarkPlugins).toContain(userRemarkPlugin)
  })
})

describe('remarkRestoreUnknownTextDirectives', () => {
  it('keeps colon text inside link labels as text', () => {
    const value = '[localhost:3003](http://localhost:3003/)'
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              title: null,
              url: 'http://localhost:3003/',
              children: [
                { type: 'text', value: 'localhost' },
                {
                  type: 'textDirective',
                  name: '3003',
                  attributes: {},
                  children: [],
                  position: {
                    start: { line: 1, column: 11, offset: 10 },
                    end: { line: 1, column: 16, offset: 15 },
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    remarkRestoreUnknownTextDirectives()(tree as never, { value } as never)

    expect(tree.children[0]?.children[0]?.children).toEqual([
      { type: 'text', value: 'localhost' },
      { type: 'text', value: ':3003' },
    ])
  })
})

describe('remarkDirectives', () => {
  const directives = Directive.resolve({ config: {} })

  async function run(markdown: string, list = directives) {
    const tree = await runRemark(markdown, [
      remarkDirective,
      () => remarkDirectives({ directives: list }),
    ])
    return tree.children[0]?.data
  }

  it('marks built-in directives with their raw attributes', async () => {
    expect(await run('::changelog{limit=10}')).toMatchInlineSnapshot(`
      {
        "hName": "div",
        "hProperties": {
          "data-v-directive": "changelog",
          "data-v-directive-attributes": "{"limit":"10"}",
        },
      }
    `)
    expect(await run('::changelog')).toMatchInlineSnapshot(`
      {
        "hName": "div",
        "hProperties": {
          "data-v-directive": "changelog",
          "data-v-directive-attributes": "{}",
        },
      }
    `)
  })

  it('marks user directives with a component', async () => {
    const list = Directive.resolve({
      config: { markdown: { directives: [{ name: 'blog-posts', component: () => null }] } },
    })
    expect(await run('::blog-posts{limit=3}', list)).toMatchInlineSnapshot(`
      {
        "hName": "div",
        "hProperties": {
          "data-v-directive": "blog-posts",
          "data-v-directive-attributes": "{"limit":"3"}",
        },
      }
    `)
  })

  it('leaves unregistered and markdown-only directives untouched', async () => {
    expect(await run('::blog-posts')).toBeUndefined()

    const list = Directive.resolve({
      config: { markdown: { directives: [{ name: 'blog-posts', toMarkdown: () => 'posts' }] } },
    })
    expect(await run('::blog-posts', list)).toBeUndefined()
  })
})

describe('remarkFileTree', () => {
  async function parse(items: { text: string }[]) {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'file-tree',
          children: [
            {
              type: 'list',
              children: items.map((item) => ({
                type: 'listItem',
                children: [
                  {
                    type: 'paragraph',
                    children: [{ type: 'text', value: item.text }],
                  },
                ],
              })),
            },
          ],
        },
      ],
    }
    await remarkFileTree(Config.define({ rootDir: process.cwd() }))(tree as never)
    const fileTree = tree.children[0] as {
      data?: { hProperties?: Record<string, string> }
    }
    return JSON.parse(fileTree.data?.hProperties?.['data-v-file-tree-items'] ?? '[]')
  }

  it('extracts {info="..."} tooltip from a plain row', async () => {
    const items = await parse([{ text: 'vocs.config.ts{info="Site config"}' }])
    expect(items[0]).toMatchObject({
      name: 'vocs.config.ts',
      type: 'file',
      tooltip: 'Site config',
    })
    expect(items[0].comment).toBeUndefined()
  })

  it('extracts tooltip from a row that also has an inline comment', async () => {
    const items = await parse([{ text: 'layout.tsx the root layout{info="Wraps every page"}' }])
    expect(items[0]).toMatchObject({
      name: 'layout.tsx',
      type: 'file',
      comment: 'the root layout',
      tooltip: 'Wraps every page',
    })
  })

  it('extracts tooltip from a folder row', async () => {
    const items = await parse([{ text: '+app the app dir{info="App router root"}' }])
    expect(items[0]).toMatchObject({
      name: 'app',
      type: 'folder',
      comment: 'the app dir',
      tooltip: 'App router root',
    })
  })

  it('supports unquoted {info=...} values', async () => {
    const items = await parse([{ text: 'page.tsx{info=Home route}' }])
    expect(items[0]).toMatchObject({
      name: 'page.tsx',
      tooltip: 'Home route',
    })
  })

  it('omits tooltip when value is empty', async () => {
    const items = await parse([{ text: 'page.tsx{info=""}' }])
    expect(items[0]).toMatchObject({ name: 'page.tsx' })
    expect(items[0].tooltip).toBeUndefined()
  })

  it('omits tooltip when no {info} present', async () => {
    const items = await parse([{ text: 'page.tsx' }])
    expect(items[0]).toMatchObject({ name: 'page.tsx' })
    expect(items[0].tooltip).toBeUndefined()
  })

  it('extracts tooltip from a trailing mdxTextExpression (MDX form)', async () => {
    // Simulate what the MDX pipeline emits for `vocs.config.ts{info="Site config"}`:
    // a text node followed by an mdxTextExpression whose value is the contents
    // between the braces (no braces).
    const tree = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'file-tree',
          children: [
            {
              type: 'list',
              children: [
                {
                  type: 'listItem',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        { type: 'text', value: 'vocs.config.ts' },
                        { type: 'mdxTextExpression', value: 'info="Site config: nav, theme"' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    await remarkFileTree(Config.define({ rootDir: process.cwd() }))(tree as never)
    const fileTree = tree.children[0] as { data?: { hProperties?: Record<string, string> } }
    const items = JSON.parse(fileTree.data?.hProperties?.['data-v-file-tree-items'] ?? '[]')
    expect(items[0]).toMatchObject({
      name: 'vocs.config.ts',
      type: 'file',
      tooltip: 'Site config: nav, theme',
    })
  })

  it('preserves inline code in file comments', async () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'file-tree',
          children: [
            {
              type: 'list',
              children: [
                {
                  type: 'listItem',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'strong',
                          children: [{ type: 'text', value: 'getting-started.mdx' }],
                        },
                        { type: 'text', value: ' A page at ' },
                        { type: 'inlineCode', value: '/guide/getting-started' },
                        { type: 'text', value: '.' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    await remarkFileTree(Config.define({ rootDir: process.cwd() }))(tree as never)

    const fileTree = tree.children[0] as {
      data?: { hProperties?: Record<string, string> }
    }
    const items = JSON.parse(fileTree.data?.hProperties?.['data-v-file-tree-items'] ?? '[]')

    expect(items[0]).toMatchObject({
      name: 'getting-started.mdx',
      type: 'file',
      comment: 'A page at /guide/getting-started.',
      highlighted: true,
    })
  })
})

describe('rehypeLinks', () => {
  function anchor(href: string) {
    return {
      type: 'element' as const,
      tagName: 'a',
      properties: { href } as Record<string, unknown>,
      children: [],
    }
  }

  it('allows OpenAPI-generated routes and flags genuinely dead links', async () => {
    OpenApiRegistry.invalidate()
    const config = Config.define({
      rootDir: process.cwd(),
      openapi: [
        {
          path: '/api',
          spec: {
            openapi: '3.1.0',
            info: { title: 'Test', version: '1.0.0' },
            tags: [{ name: 'Indexer' }],
            paths: {
              '/v1/indexer/query': {
                get: {
                  tags: ['Indexer'],
                  operationId: 'indexerQuery',
                  responses: { '200': { description: 'ok' } },
                },
              },
            },
          },
        },
      ],
    })
    await OpenApiRegistry.build(config)

    const overview = anchor('/api')
    const generated = anchor('/api/indexer')
    const trailing = anchor('/api/indexer/')
    const dead = anchor('/api/does-not-exist')
    const tree = {
      type: 'root' as const,
      children: [overview, generated, trailing, dead],
    }
    const vfile = { path: path.join(process.cwd(), 'src/pages/api/indexer-api.mdx') }

    rehypeLinks(config)()(tree as never, vfile as never)

    expect(overview.properties['data-v-dead-link']).toBeUndefined()
    expect(generated.properties['data-v-dead-link']).toBeUndefined()
    expect(trailing.properties['data-v-dead-link']).toBeUndefined()
    expect(dead.properties['data-v-dead-link']).toBe('')
    expect(deadLinks.get(vfile.path)).toEqual(['/api/does-not-exist'])

    deadLinks.delete(vfile.path)
    OpenApiRegistry.invalidate()
  })
})

describe('rehypeHeadingAnchors', () => {
  function headingAnchor(
    href: string,
    properties: Record<string, unknown> = { className: ['heading-anchor'] },
  ) {
    return {
      type: 'element' as const,
      tagName: 'a',
      properties: { ...properties, href } as Record<string, unknown>,
      children: [],
    }
  }

  function run(anchors: ReturnType<typeof headingAnchor>[], filePath: string) {
    const config = Config.define({ rootDir: process.cwd() })
    const tree = { type: 'root' as const, children: anchors }
    const vfile = { path: path.join(process.cwd(), filePath) }
    rehypeHeadingAnchors(config)()(tree as never, vfile as never)
  }

  it('resolves hash-only hrefs against the page path', () => {
    const anchor = headingAnchor('#overview')
    run([anchor], 'src/pages/guide/getting-started.mdx')
    expect(anchor.properties['href']).toBe('/guide/getting-started#overview')
  })

  it('resolves index pages to their directory path', () => {
    const nested = headingAnchor('#overview')
    run([nested], 'src/pages/guide/index.mdx')
    expect(nested.properties['href']).toBe('/guide#overview')

    const root = headingAnchor('#overview')
    run([root], 'src/pages/index.md')
    expect(root.properties['href']).toBe('/#overview')
  })

  it('ignores anchors without the heading-anchor class', () => {
    const anchor = headingAnchor('#overview', {})
    run([anchor], 'src/pages/guide/getting-started.mdx')
    expect(anchor.properties['href']).toBe('#overview')
  })

  it('ignores non-hash hrefs', () => {
    const anchor = headingAnchor('/other-page#overview')
    run([anchor], 'src/pages/guide/getting-started.mdx')
    expect(anchor.properties['href']).toBe('/other-page#overview')
  })

  it('ignores files outside the pages directory', () => {
    const anchor = headingAnchor('#overview')
    run([anchor], 'other/getting-started.mdx')
    expect(anchor.properties['href']).toBe('#overview')
  })

  it('ignores pages with dynamic segments', () => {
    const anchor = headingAnchor('#overview')
    run([anchor], 'src/pages/blog/[slug].mdx')
    expect(anchor.properties['href']).toBe('#overview')
  })
})
