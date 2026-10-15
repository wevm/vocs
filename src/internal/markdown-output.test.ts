import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { buildLlmsContent, getPagesFromDir } from './llms.js'
import { inlineMarkdownComponents } from './markdown-components.js'
import { inspect, manifest, resolveValidation } from './markdown-output.js'
import {
  remarkDefaultFrontmatter,
  remarkExtractFrontmatter,
  remarkFrontmatter,
  remarkStripFrontmatter,
  remarkStripJs,
} from './mdx.js'

const roots: string[] = []
afterEach(async () => {
  vi.unstubAllEnvs()
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })))
})
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-output-'))
  roots.push(root)
  await fs.writeFile(
    path.join(root, 'components.ts'),
    `
export function Panel() { return null }
export function Label() { return null }
export default Panel
export const markdown = {
  Panel: (props, context) => [
    { type: 'heading', depth: 2, children: [{ type: 'text', value: props.title }] },
    ...context.renderChildren(),
  ],
  Label: (props) => [{ type: 'text', value: props.value }],
  Icon: () => [],
  default: () => [{ type: 'paragraph', children: [{ type: 'text', value: 'Default renderer' }] }],
}
`,
  )
  return root
}
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

describe('validation modes', () => {
  test.each([
    [{}, 'warn', 'default'],
    [{ config: 'fail' }, 'fail', 'config'],
    [{ config: 'fail', environment: 'warn' }, 'warn', 'environment'],
    [{ config: 'fail', environment: 'warn', cli: 'fail' }, 'fail', 'cli'],
  ] as const)('resolves %j', (options, validation, validationSource) => {
    vi.stubEnv('VOCS_MARKDOWN_VALIDATION', undefined)
    expect(resolveValidation(options)).toEqual({ validation, validationSource })
  })
  test.each(['skip', '', 'false'])('rejects invalid mode %j', (environment) => {
    expect(() => resolveValidation({ environment })).toThrow('Expected warn or fail')
  })
  test('runs identical checks in both modes and retains unsupported syntax', async () => {
    const options = {
      ...plugins,
      title: 'Docs',
      pages: [
        {
          path: '/guide',
          content: '# Guide\n\n<Unknown />\n\n{runtimeValue}\n\n```tsx\n<Example />\n```',
        },
      ],
    }
    const warn = await buildLlmsContent({ ...options, validation: 'warn' })
    const fail = await buildLlmsContent({ ...options, validation: 'fail' })
    expect(warn.report.diagnostics).toEqual(fail.report.diagnostics)
    expect(warn.report.diagnostics.map((item) => item.rule)).toEqual([
      'unhandled-component',
      'unhandled-expression',
    ])
    expect(warn.results[0]?.content).toContain('{runtimeValue}')
    expect(warn.full).toContain(warn.results[0]?.content)
  })
})

describe('component declarations', () => {
  test('resolves aliases, namespace and default imports, nested children, and inline output', async () => {
    const root = await fixture()
    const result = await inlineMarkdownComponents(
      `import Default, { Panel as Box, Label, Icon } from './components.ts'
import * as UI from './components.ts'

<Box title="Instructions">

Read <Label value={'carefully'} />.

<UI.Panel title="Nested">

Preserved children.

</UI.Panel>

<Icon />

</Box>

<Default />`,
      path.join(root, 'guide.mdx'),
    )
    expect(result).toContain('## Instructions')
    expect(result).toContain('Read carefully.')
    expect(result).toContain('## Nested')
    expect(result).toContain('Preserved children.')
    expect(result).toContain('Default renderer')
    expect(result).not.toContain('<Icon')
    expect(result).not.toContain('<Box')
  })
  test('matches config overrides by module identity and export, before loading browser modules', async () => {
    const root = await fixture()
    await fs.writeFile(path.join(root, 'browser.ts'), 'throw new Error("browser only")')
    const result = await inlineMarkdownComponents(
      `import { Panel as Box } from './browser.ts'\nimport { Panel } from './components.ts'\n\n<Box />\n\n<Panel title="Original" />`,
      path.join(root, 'guide.mdx'),
      {
        rootDir: root,
        components: [
          {
            module: './browser.ts',
            export: 'Panel',
            render: () => [{ type: 'paragraph', children: [{ type: 'text', value: 'Override' }] }],
          },
        ],
      },
    )
    expect(result).toContain('Override')
    expect(result).toContain('## Original')
  })
  test.each([
    'title={load()}',
    '{...props}',
    'title={name}',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: _
    'title={`Hello ${name}`}',
  ])('does not execute dynamic props: %s', async (props) => {
    const root = await fixture()
    const source = `import { Panel } from './components.ts'\n\n<Panel ${props} />`
    expect(await inlineMarkdownComponents(source, path.join(root, 'guide.mdx'))).toBe(source)
  })
  test('rejects block nodes in inline positions and renderer crashes', async () => {
    const root = await fixture()
    await expect(
      inlineMarkdownComponents(
        `import { Panel } from './components.ts'\n\nText <Panel title="Invalid" />.`,
        path.join(root, 'guide.mdx'),
      ),
    ).rejects.toThrow('phrasing nodes')
    await expect(
      inlineMarkdownComponents(
        `import { Panel } from './components.ts'\n\n<Panel />`,
        path.join(root, 'guide.mdx'),
        {
          rootDir: root,
          components: [
            {
              module: './components.ts',
              export: 'Panel',
              render: () => {
                throw new Error('Renderer failed')
              },
            },
          ],
        },
      ),
    ).rejects.toThrow('Renderer failed')
  })
  test('flattens all built-in tabs with labels and card links', async () => {
    const root = await fixture()
    const result = await inlineMarkdownComponents(
      `import { Tabs, Tab, Card } from 'vocs'\n\n<Tabs>\n\n<Tab title="REST">\n\nREST instructions.\n\n</Tab>\n\n<Tab title="MCP">\n\n<Card title="Reference" to="/reference" description="API schemas" />\n\n</Tab>\n\n</Tabs>`,
      path.join(root, 'guide.mdx'),
    )
    expect(result).toContain('### REST')
    expect(result).toContain('### MCP')
    expect(result).toContain('[Reference](/reference): API schemas')
    expect(inspect(result.replace(/^import .*\n/, ''), '/guide')).toEqual([])
  })
})

test('checks explicit export links, but ignores code and normal application links', () => {
  const findings = inspect(
    '# Guide\n\n[Missing](./missing.md)\n\n[App](/dashboard)\n\n`<Inline />`\n\n```tsx\n<Fenced />\n```',
    '/guide',
    new Set(['/guide']),
  )
  expect(findings).toEqual([
    expect.objectContaining({ rule: 'broken-export-link', file: '/guide' }),
  ])
})

test('includes untitled and unlisted pages; reports duplicate authored routes', async () => {
  const result = await buildLlmsContent({
    ...plugins,
    title: 'Docs',
    pages: [
      { path: '/untitled', content: 'Useful content.' },
      { path: '/untitled', content: 'Duplicate.' },
      { path: '/other', content: '# Other' },
    ],
  })
  expect(result.results).toHaveLength(2)
  expect(result.short).toContain('[/untitled](/untitled.md)')
  expect(result.report.diagnostics.map((item) => item.rule)).toEqual([
    'duplicate-page',
    'missing-title',
  ])
})

test('page discovery removes only complete index path segments and notices deletions', async () => {
  const root = await fixture()
  await fs.writeFile(path.join(root, 'index.mdx'), '# Home')
  await fs.writeFile(path.join(root, '_partial.mdx'), '# Excluded partial')
  await fs.writeFile(path.join(root, 'search-index.mdx'), '# Search')
  expect((await getPagesFromDir(root)).map((page) => page.path).sort()).toEqual([
    '/',
    '/search-index',
  ])
  await fs.rm(path.join(root, 'search-index.mdx'))
  expect((await getPagesFromDir(root)).map((page) => page.path)).toEqual(['/'])
})

test('manifest is deterministic and detects any changed artifact bytes', () => {
  const original = manifest({ '/b.md': 'B', '/a.md': 'A' })
  expect(original).toEqual(manifest({ '/a.md': 'A', '/b.md': 'B' }))
  expect(original.files['/a.md']).not.toEqual(manifest({ '/a.md': 'Updated' }).files['/a.md'])
})

test.each([
  [200, 'text/markdown; charset=utf-8', 'Expected', 0],
  [200, 'text/html', '<html>Fallback</html>', 1],
  [200, 'text/plain', 'Stale', 1],
  [404, 'text/plain', 'Missing', 1],
])('deployment verification: %s %s', async (status, contentType, body, count) => {
  const { verifyDeployment } = await import('./markdown-output.js')
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValue(new Response(body, { status, headers: { 'content-type': contentType } }))
  const diagnostics = await verifyDeployment({
    url: 'https://preview.example/docs',
    manifest: manifest({ '/guide.md': 'Expected' }),
    fetch,
  })
  expect(diagnostics).toHaveLength(count)
  expect(String(fetch.mock.calls[0]?.[0])).toBe('https://preview.example/docs/guide.md')
})

test('deployment network failures produce actionable diagnostics', async () => {
  const { verifyDeployment } = await import('./markdown-output.js')
  const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error('Timeout'))
  expect(
    await verifyDeployment({
      url: 'https://preview.example',
      manifest: manifest({ '/guide.md': 'Expected' }),
      fetch,
    }),
  ).toEqual([{ rule: 'deployment-mismatch', file: '/guide.md', message: 'Timeout' }])
})

test('normalizes relative links and escapes index metadata for aggregation', async () => {
  const result = await buildLlmsContent({
    ...plugins,
    title: 'Docs',
    pages: [
      {
        path: '/guides/start',
        content:
          '---\ntitle: "A [guide]"\ndescription: |\n  First line\n  Second line\n---\n\n[Next](./next.md)\n\n[Section](#details)\n\n![Image](../image.png)',
      },
      { path: '/guides/next', content: '# Next' },
    ],
  })
  expect(result.short).toContain('A \\[guide\\]')
  expect(result.short).toContain('First line Second line')
  expect(result.results.find((page) => page.path === '/guides/start')?.content).toContain(
    '](/guides/next.md)',
  )
  expect(result.results.find((page) => page.path === '/guides/start')?.content).toContain(
    '](/guides/start#details)',
  )
  expect(result.results.find((page) => page.path === '/guides/start')?.content).toContain(
    '](/image.png)',
  )
  expect(result.report.diagnostics).toEqual([])
})

test('built-in callouts support inline MDX syntax without inserting block nodes', async () => {
  const root = await fixture()
  const result = await inlineMarkdownComponents(
    `import { Callout } from 'vocs'\n\n<Callout title="Note">Preserve this content.</Callout>`,
    path.join(root, 'guide.mdx'),
  )
  expect(result).toContain('Note:')
  expect(result).toContain('Preserve this content.')
  expect(result).not.toContain('<Callout')
})

test('valid HTML comments do not hide unresolved components or change locations', () => {
  expect(inspect('<!-- Generated content -->\n\n<Unknown />', '/guide')).toEqual([
    expect.objectContaining({ rule: 'unhandled-component', line: 3 }),
  ])
  expect(inspect('<!-- Only a comment -->', '/guide')).toEqual([])
})

describe('final output transform', () => {
  test('uses final page bytes in full output and manifest, preserving metadata and order', async () => {
    const result = await buildLlmsContent({
      ...plugins,
      title: 'Docs',
      pages: [{ path: '/guide', content: '# Guide\n\nBody.' }],
      pagePrelude: '> Shared prelude',
      transform: async ({ index, pages }) => ({
        index: `${index}\n\n> Custom index note`,
        pages: Object.fromEntries(
          Object.entries(pages).map(([route, content]) => [
            route,
            `> Source: ${route}\n\n${content}`,
          ]),
        ),
      }),
    })
    expect(result.short).toContain('Custom index note')
    expect(result.results[0]?.content).toContain('> Source: /guide\n\n> Shared prelude')
    expect(result.full).toContain(result.short)
    expect(result.full).toContain(result.results[0]?.content)
    expect(result.results[0]?.title).toBe('Guide')
    expect(result.report.diagnostics).toEqual([])
    const page = result.results[0]
    if (!page) throw new Error('Expected generated guide')
    expect(manifest({ '/guide.md': page.content })).not.toEqual(
      manifest({ '/guide.md': '# Guide\n\nBody.' }),
    )
  })
  test.each([
    'warn',
    'fail',
  ] as const)('validates transformed pages and index in %s mode', async (validation) => {
    const result = await buildLlmsContent({
      ...plugins,
      title: 'Docs',
      validation,
      pages: [{ path: '/guide', content: '# Guide' }],
      transform: ({ index }) => ({
        index: `${index}\n\n<IndexWidget />`,
        pages: { '/guide': '<PageWidget />' },
      }),
    })
    expect(result.report.validation).toBe(validation)
    expect(result.report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ file: '/llms.txt', component: 'IndexWidget' }),
        expect.objectContaining({ file: '/guide', component: 'PageWidget' }),
      ]),
    )
  })
  test.each([
    {},
    { '/guide': '# Guide', '/extra': 'Extra' },
    { '/renamed': '# Guide' },
    { '/guide': 42 },
  ])('rejects inventory changes or invalid content: %j', async (pages) => {
    await expect(
      buildLlmsContent({
        ...plugins,
        title: 'Docs',
        pages: [{ path: '/guide', content: '# Guide' }],
        // Invalid JavaScript config still receives runtime validation.
        transform: () => ({ index: '# Index', pages }) as never,
      }),
    ).rejects.toThrow('same page routes')
  })
  test('propagates transform failures even in warn mode', async () => {
    await expect(
      buildLlmsContent({
        ...plugins,
        title: 'Docs',
        validation: 'warn',
        pages: [],
        transform: () => {
          throw new Error('Data unavailable')
        },
      }),
    ).rejects.toThrow('Data unavailable')
  })
})

describe('shared component loader', () => {
  test('evaluates a module once across pages and concurrent exports', async () => {
    const root = await fixture()
    await fs.writeFile(
      path.join(root, 'shared.ts'),
      `
      let count = 0
      export const markdown = { Counter: () => [{ type: 'paragraph', children: [{ type: 'text', value: String(++count) }] }] }
    `,
    )
    const source = "import { Counter } from './shared.js'\n\n<Counter />"
    const outputs = await Promise.all(
      ['a', 'b'].map((name) => inlineMarkdownComponents(source, path.join(root, `${name}.mdx`))),
    )
    expect(outputs.map((output) => output.trim().split('\n').at(-1)).sort()).toEqual(['1', '2'])
  })
  test('refreshes transitive source changes and recovers after a source error', async () => {
    const root = await fixture()
    await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ type: 'module' }))
    const child = path.join(root, 'value.ts')
    await fs.writeFile(child, "export const value = 'Before'")
    await fs.writeFile(
      path.join(root, 'live.ts'),
      `
      import { value } from './value.js'
      export const markdown = { Live: () => [{ type: 'paragraph', children: [{ type: 'text', value }] }] }
    `,
    )
    const source = "import { Live } from './live.js'\n\n<Live />"
    const page = path.join(root, 'guide.mdx')
    expect(await inlineMarkdownComponents(source, page)).toContain('Before')
    await fs.writeFile(child, "export const value = 'After'")
    const future = new Date(Date.now() + 2000)
    await fs.utimes(child, future, future)
    expect(await inlineMarkdownComponents(source, page)).toContain('After')
    await fs.writeFile(child, "throw new Error('broken'); export const value = 'broken'")
    await fs.utimes(child, new Date(+future + 2000), new Date(+future + 2000))
    expect(await inlineMarkdownComponents(source, page)).toContain('<Live />')
    await fs.writeFile(child, "export const value = 'Recovered'")
    await fs.utimes(child, new Date(+future + 4000), new Date(+future + 4000))
    expect(await inlineMarkdownComponents(source, page)).toContain('Recovered')
  })
})

test('public Markdown assets are valid links without joining the generated inventory', async () => {
  const publicDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-public-'))
  roots.push(publicDir)
  await fs.writeFile(path.join(publicDir, 'SKILL.md'), '# Skill')
  const result = await buildLlmsContent({
    title: 'Docs',
    ...plugins,
    publicDir,
    pages: [
      {
        path: '/guide',
        title: 'Guide',
        content: '# Guide\n\n[Skill](/SKILL.md) [Missing](/missing.md)',
      },
    ],
  })
  expect(result.report.diagnostics.map((item) => item.message)).toEqual([
    'No generated Markdown page for /missing.md.',
  ])
  expect(result.results).toHaveLength(1)
  expect(result.full).not.toContain('# Skill')
})

describe('review regressions', () => {
  test.each([
    '<ui.Panel />',
    '<_Panel />',
    '<$Panel />',
  ])('diagnoses component form %s', (content) => {
    expect(inspect(content, '/guide')).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'unhandled-component' })]),
    )
  })
  test.each([
    '<div>Text</div>',
    '<my-element />',
    '<linearGradient />',
    '<svg:path />',
  ])('allows intrinsic markup %s', (content) => {
    expect(inspect(content, '/guide')).toEqual([])
  })
  test.each([
    ['/café.md', '/café'],
    ['/caf%C3%A9.md', '/café'],
    ['/hello%20world.md', '/hello world'],
    ['/100%25.md', '/100%'],
    ['/bad%ZZ.md', '/bad%ZZ'],
  ])('validates encoded link %s', (url, route) => {
    expect(inspect(`[Page](${url})`, '/guide', new Set([route]))).toEqual([])
  })
  test('does not treat encoded slashes as route separators', () => {
    expect(inspect('[Page](/one%2Ftwo.md)', '/guide', new Set(['/one/two']))).toEqual([
      expect.objectContaining({ rule: 'broken-export-link' }),
    ])
  })
  test.each([
    'warn',
    'fail',
  ] as const)('checks aggregate metadata in %s mode', async (validation) => {
    const result = await buildLlmsContent({
      ...plugins,
      validation,
      title: 'Docs {preview}',
      description: '<Metadata />',
      pages: [{ path: '/guide', title: 'Guide', content: '# Guide' }],
    })
    expect(result.report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ file: '/llms.txt', rule: 'unhandled-expression' }),
        expect.objectContaining({ file: '/llms.txt', rule: 'unhandled-component' }),
      ]),
    )
  })
  test('resolves index siblings, parent links, images, definitions, and fragments', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-index-links-'))
    roots.push(root)
    await fs.mkdir(path.join(root, 'guides'))
    await fs.writeFile(
      path.join(root, 'guides/index.mdx'),
      '# Guides\n\n[Next](./next.md) [Parent](../intro.md) [Here](#details)\n\n![Image](./image.png)\n\n[Reference][next]\n\n[next]: ./next.md',
    )
    await fs.writeFile(path.join(root, 'guides/next.mdx'), '# Next\n\n[Sibling](../intro.md)')
    await fs.writeFile(path.join(root, 'intro.mdx'), '# Intro')
    const result = await buildLlmsContent({
      ...plugins,
      title: 'Docs',
      pages: await getPagesFromDir(root),
    })
    const index = result.results.find((page) => page.path === '/guides')?.content
    expect(index).toContain('[Next](/guides/next.md)')
    expect(index).toContain('[Parent](/intro.md)')
    expect(index).toContain('[Here](/guides#details)')
    expect(index).toContain('![Image](/guides/image.png)')
    expect(index).toContain('[next]: /guides/next.md')
    expect(result.report.diagnostics).toEqual([])
  })
})

test('full exports do not reintroduce untransformed navigation', async () => {
  const result = await buildLlmsContent({
    ...plugins,
    title: 'Docs',
    pages: [{ path: '/docs/guide', title: 'Guide', content: '# Guide' }],
    transform: ({ index, pages }) => ({
      index: index.replaceAll('](/docs/', '](https://example.com/docs/'),
      pages,
    }),
  })
  expect(result.short).toContain('](https://example.com/docs/guide.md)')
  expect(result.full).toContain(result.short)
  expect(result.full).not.toContain('](/docs/')
  expect(result.report.diagnostics).toEqual([])
})
