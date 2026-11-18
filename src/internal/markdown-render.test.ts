import { describe, expect, test } from 'vitest'
import * as MarkdownRender from './markdown-render.js'

describe('render', () => {
  test('renders components by imported name, with context and string or node results', async () => {
    const source = `import { Card as Box, PostList } from './components'
import * as UI from './ui'

# Title

<Box title="Start" href="/start">
  Read **this** first.
</Box>

<PostList />

<UI.Note>
  Inline <UI.Badge label="new" /> text.
</UI.Note>
`
    const markdown = await MarkdownRender.render(source, {
      context: { posts: [{ title: 'Hello', href: '/blog/hello' }] },
      renderers: {
        Card: (props, element) =>
          `### [${props['title']}](${props['href']})\n\n${element.children()}`,
        PostList: (_props, element) =>
          element.context.posts.map((post) => `- [${post.title}](${post.href})`).join('\n'),
        Note: (_props, element) => [
          { type: 'blockquote', children: element.renderChildren() as never },
        ],
        Badge: (props) => ({ type: 'inlineCode', value: String(props['label']) }),
      },
    })
    expect(markdown).toMatchInlineSnapshot(`
      "# Title

      ### [Start](/start)

      Read **this** first.

      - [Hello](/blog/hello)

      > Inline \`new\` text.
      "
    `)
  })

  test('keeps the source bytes of ordinary Markdown and code', async () => {
    const source = `# Title

Some *emphasis*   with   spaces, a [link][ref], and a table:

| a | b |
|:--|--:|
| 1 | <Value /> |

\`\`\`tsx
<NotRendered prop={x} />
\`\`\`

[ref]: https://example.com
`
    const markdown = await MarkdownRender.render(source, { renderers: { Value: () => '2' } })
    expect(markdown).toBe(source.replace('<Value />', '2'))
  })

  test('continues rendered blocks on their container prefix', async () => {
    const source = `> <Steps />

- Item

  <Steps />
`
    const markdown = await MarkdownRender.render(source, {
      renderers: { Steps: () => '1. One\n2. Two' },
    })
    expect(markdown).toMatchInlineSnapshot(`
      "> 1. One
      > 2. Two

      - Item

        1. One
        2. Two
      "
    `)
  })

  test('lowers intrinsic HTML elements', async () => {
    const source = `<h2>Heading</h2>

<p>A <a href="/x">link</a>, <strong>bold</strong>, <code>code</code>, and <img src="/a.png" alt="A" />.</p>

<ul>
  <li>One</li>
  <li><a href="/two">Two</a></li>
</ul>

<ol>
  <li>First</li>
  <li>Second</li>
</ol>

<table>
  <thead>
    <tr><th>Name</th><th>Value</th></tr>
  </thead>
  <tbody>
    <tr><td>a</td><td>1</td></tr>
  </tbody>
</table>

<iframe src="https://youtube.com/embed/x" title="Demo" />

<video src="/demo.mp4" />

<a href="/card">
  <h3>Card title</h3>
  <p>Card body.</p>
</a>

<div>
  Wrapped <span>text</span>.
</div>
`
    expect(await MarkdownRender.render(source)).toMatchInlineSnapshot(`
      "## Heading

      A [link](/x), **bold**, \`code\`, and ![A](/a.png).

      * One
      * [Two](/two)

      1. First
      2. Second

      | Name | Value |
      | ---- | ----- |
      | a    | 1     |

      [Demo](https://youtube.com/embed/x)

      [Watch video](/demo.mp4)

      ### [Card title](/card)

      Card body.

      Wrapped text.
      "
    `)
  })

  test('renders JSX props as Markdown and reads literal props', async () => {
    const source = `<Hero title={<>Move <em>money</em></>} items={[{ label: 'a', count: -1 }, { label: \`b\` }]} />`
    const markdown = await MarkdownRender.render(source, {
      renderers: {
        Hero: (props) =>
          `# ${(props['title'] as { markdown: string }).markdown}\n\n${JSON.stringify(props['items'])}`,
      },
    })
    expect(markdown).toMatchInlineSnapshot(`
      "# Move *money*

      [{"label":"a","count":-1},{"label":"b"}]"
    `)
  })

  test('renders literal expressions and drops comments', async () => {
    const source = `Version {'2.0'} of {3} items.

{/* A comment */}

Done.
`
    expect(await MarkdownRender.render(source)).toMatchInlineSnapshot(`
      "Version 2.0 of 3 items.

      Done.
      "
    `)
  })

  describe('onMissing', () => {
    test.each([
      ['<Unknown />', 'Missing Markdown renderer for <Unknown>.'],
      ['<marquee>Old</marquee>', 'Missing Markdown renderer for <marquee>.'],
      ['<Card title={load()} />', 'must be literal'],
      ['<Card {...props} />', 'Spread props'],
      ['Value: {count}', 'must be literal'],
    ])('throw: %s', async (source, message) => {
      await expect(
        MarkdownRender.render(source, { renderers: { Card: () => 'card' } }),
      ).rejects.toThrow(message)
    })

    test('keep leaves what it cannot render as written, with its imports', async () => {
      const source = `import { Live } from './live'

<Live>

<Known />

</Live>

<Card title={load()} />

Value: {count}
`
      const markdown = await MarkdownRender.render(source, {
        onMissing: 'keep',
        renderers: { Known: () => '**known**', Card: () => 'card' },
      })
      expect(markdown).toBe(source.replace('<Known />', '**known**'))
    })

    test('intrinsic: false keeps HTML elements as written', async () => {
      const source = '<div>\n  <p>Hi</p>\n</div>\n'
      expect(await MarkdownRender.render(source, { intrinsic: false })).toBe(source)
    })
  })

  test('resolve looks up renderers by import', async () => {
    const seen: MarkdownRender.Component[] = []
    const markdown = await MarkdownRender.render(
      `import Default from './default'\nimport { Tabs } from 'vocs'\n\n<Default />\n\n<Tabs.Tab title="A">x</Tabs.Tab>`,
      {
        resolve: (component) => {
          seen.push(component)
          return () => component.name
        },
      },
    )
    expect(markdown).toBe('Default\n\nTabs.Tab')
    expect(seen).toEqual([
      { name: 'Default', source: './default', export: 'default', empty: true, inline: false },
      { name: 'Tabs.Tab', source: 'vocs', export: 'Tabs', empty: false, inline: true },
    ])
  })

  test('rejects invalid renderer results and block nodes inline', async () => {
    await expect(
      MarkdownRender.render('<Bad />', { renderers: { Bad: () => [1] as never } }),
    ).rejects.toThrow('<Bad>: a Markdown renderer must return a string')
    await expect(
      MarkdownRender.render('Text <Block />.', {
        renderers: { Block: () => ({ type: 'heading', depth: 2, children: [] }) },
      }),
    ).rejects.toThrow('phrasing nodes')
  })
})
