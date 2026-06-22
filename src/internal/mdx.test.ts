import * as path from 'node:path'
import type * as Estree from 'estree'
import type * as MdAst from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import ruby from 'shiki/langs/ruby.mjs'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'
import * as Config from './config.js'
import {
  getCompileOptions,
  recmaMdxLayout,
  remarkCodeTitle,
  remarkDefaultFrontmatter,
  remarkFilename,
  remarkFileTree,
  remarkLangCommaAttrs,
  remarkRestoreUnknownTextDirectives,
  remarkSubheading,
} from './mdx.js'

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

async function runRemark(markdown: string, plugins: unknown[]) {
  const processor = unified().use(remarkParse)
  for (const plugin of plugins) processor.use(plugin as never)
  const tree = processor.parse(markdown) as MdAst.Root
  await processor.run(tree)
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
