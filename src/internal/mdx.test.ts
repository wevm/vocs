import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import type * as HAst from 'hast'
import type * as MdAst from 'mdast'
import ruby from 'shiki/langs/ruby.mjs'
import type { VFile } from 'vfile'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Config from './config.js'
import {
  anchorLinks,
  anchors,
  deadLinks,
  getCompileOptions,
  getDeadAnchorLinks,
  rehypeLinks,
  remarkAnchorLinks,
  remarkCodeTitle,
  remarkLangCommaAttrs,
} from './mdx.js'
import { mdx as viteMdx } from './vite-plugins.js'

type CodeNode = {
  type: 'code'
  lang?: string | undefined
  meta?: string | undefined
  value: string
}

type Root = {
  type: 'root'
  children: [CodeNode]
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

  return tree.children[0]
}

function createTestConfig(rootDir: string): Config.Config {
  return Config.define({
    checkDeadAnchors: true,
    checkDeadlinks: true,
    rootDir,
    srcDir: 'src',
  })
}

function createPage(rootDir: string, route: string) {
  const file = path.join(rootDir, 'src/pages', `${route}.mdx`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, '')
  return file
}

function runRehypeLinks(config: Config.Config, file: string, tree: HAst.Root) {
  const plugin = rehypeLinks(config)()
  plugin(tree, {
    path: file,
    dirname: path.dirname(file),
  } as VFile)
}

function runRemarkAnchorLinks(config: Config.Config, file: string, tree: MdAst.Root) {
  const plugin = remarkAnchorLinks(config)()
  plugin(tree, {
    path: file,
    dirname: path.dirname(file),
  } as VFile)
}

function runBuildEnd(config: Config.Config) {
  const plugin = viteMdx(config) as unknown as {
    buildEnd: () => void
    configResolved: (config: { command: 'build' | 'serve' }) => void
  }
  plugin.configResolved({ command: 'build' })
  plugin.buildEnd()
}

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

describe('anchor link checking', () => {
  beforeEach(() => {
    anchors.clear()
    anchorLinks.clear()
    deadLinks.clear()
  })

  it('reports dead hash-only links against anchors in the current page', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const file = createPage(rootDir, 'index')
    const config = createTestConfig(rootDir)

    runRehypeLinks(config, file, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'existing' },
          children: [],
        },
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '#missing' },
          children: [],
        },
      ],
    })

    expect([...(anchors.get(file) ?? [])]).toEqual(['existing'])
    expect(getDeadAnchorLinks().get(file)).toMatchObject([{ href: '#missing', anchor: 'missing' }])

    fs.rmSync(rootDir, { recursive: true })
  })

  it('reports dead anchors across pages', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const indexFile = createPage(rootDir, 'index')
    const targetFile = createPage(rootDir, 'target')
    const config = createTestConfig(rootDir)

    runRehypeLinks(config, targetFile, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'target-section' },
          children: [],
        },
      ],
    })
    runRehypeLinks(config, indexFile, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '/target#target-section' },
          children: [],
        },
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '/target#missing-section' },
          children: [],
        },
      ],
    })

    expect(getDeadAnchorLinks().get(indexFile)).toMatchObject([
      { href: '/target#missing-section', anchor: 'missing-section' },
    ])

    fs.rmSync(rootDir, { recursive: true })
  })

  it('does not report valid same-page, cross-page, or index-route anchors', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const indexFile = createPage(rootDir, 'index')
    const targetFile = createPage(rootDir, 'target')
    const guideIndexFile = createPage(rootDir, 'guide/index')
    const config = createTestConfig(rootDir)

    runRehypeLinks(config, targetFile, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'target-section' },
          children: [],
        },
      ],
    })
    runRehypeLinks(config, guideIndexFile, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'guide-section' },
          children: [],
        },
      ],
    })
    runRemarkAnchorLinks(config, indexFile, {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'Card',
          attributes: [{ type: 'mdxJsxAttribute', name: 'to', value: '#local-section' }],
          children: [],
        },
      ],
    } as MdAst.Root)
    runRehypeLinks(config, indexFile, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'local-section' },
          children: [],
        },
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '/target#target-section' },
          children: [],
        },
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '/guide#guide-section' },
          children: [],
        },
      ],
    })

    expect(getDeadAnchorLinks().size).toBe(0)

    fs.rmSync(rootDir, { recursive: true })
  })

  it('collects anchor links from MDX JSX href and to props', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const indexFile = createPage(rootDir, 'index')
    const targetFile = createPage(rootDir, 'target')
    const config = createTestConfig(rootDir)

    runRemarkAnchorLinks(config, indexFile, {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'Card',
          attributes: [
            { type: 'mdxJsxAttribute', name: 'to', value: '#local-missing' },
            { type: 'mdxJsxAttribute', name: 'href', value: '/target#target-missing' },
          ],
          children: [],
        },
      ],
    } as MdAst.Root)
    runRehypeLinks(config, indexFile, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'local-existing' },
          children: [],
        },
      ],
    })
    runRehypeLinks(config, targetFile, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'target-existing' },
          children: [],
        },
      ],
    })

    expect(getDeadAnchorLinks().get(indexFile)).toMatchObject([
      { href: '#local-missing', anchor: 'local-missing' },
      { href: '/target#target-missing', anchor: 'target-missing' },
    ])

    fs.rmSync(rootDir, { recursive: true })
  })

  it('does not collect anchor links when checkDeadAnchors is disabled', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const file = createPage(rootDir, 'index')
    const config = {
      ...createTestConfig(rootDir),
      checkDeadAnchors: false,
    }

    runRemarkAnchorLinks(config, file, {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'Card',
          attributes: [{ type: 'mdxJsxAttribute', name: 'to', value: '#missing' }],
          children: [],
        },
      ],
    } as MdAst.Root)
    runRehypeLinks(config, file, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '#missing' },
          children: [],
        },
      ],
    })

    expect(anchorLinks.get(file)).toBeUndefined()
    expect(getDeadAnchorLinks().size).toBe(0)

    fs.rmSync(rootDir, { recursive: true })
  })

  it('leaves missing target pages to dead-link checking instead of anchor checking', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const file = createPage(rootDir, 'index')
    const config = createTestConfig(rootDir)

    runRehypeLinks(config, file, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '/missing#anchor' },
          children: [],
        },
      ],
    })

    expect(anchorLinks.get(file)).toBeUndefined()
    expect(getDeadAnchorLinks().size).toBe(0)
    expect(deadLinks.get(file)).toEqual(['/missing#anchor'])

    consoleError.mockRestore()
    fs.rmSync(rootDir, { recursive: true })
  })

  it('throws during production builds when checkDeadAnchors is true', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const file = createPage(rootDir, 'index')
    const config = createTestConfig(rootDir)

    runRehypeLinks(config, file, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'existing' },
          children: [],
        },
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '#missing' },
          children: [],
        },
      ],
    })

    expect(() => runBuildEnd(config)).toThrow(/Found dead anchors:[\s\S]*#missing/)

    fs.rmSync(rootDir, { recursive: true })
  })

  it('does not throw during production builds when checkDeadAnchors is warn', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-test-'))
    const file = createPage(rootDir, 'index')
    const config = {
      ...createTestConfig(rootDir),
      checkDeadAnchors: 'warn',
    } as Config.Config

    runRehypeLinks(config, file, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '#missing' },
          children: [],
        },
      ],
    })

    expect(() => runBuildEnd(config)).not.toThrow()

    consoleWarn.mockRestore()
    fs.rmSync(rootDir, { recursive: true })
  })
})
