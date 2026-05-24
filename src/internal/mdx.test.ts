import ruby from 'shiki/langs/ruby.mjs'
import { describe, expect, it } from 'vitest'
import * as Config from './config.js'
import { getCompileOptions, remarkCodeTitle, remarkFilename, remarkLangCommaAttrs } from './mdx.js'

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
})
