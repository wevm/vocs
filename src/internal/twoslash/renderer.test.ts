import type { NodeHover, NodeQuery } from 'twoslash'
import { expect, test } from 'vitest'
import { defaultMarkdownPatterns, reconstructDocs, rich, rustMarkdownPatterns } from './renderer.js'

// Re-implement fixUnclosedCodeBlocks for testing (since it's not exported)
function fixUnclosedCodeBlocks(markdown: string, patterns: RegExp[]): string {
  const lines = markdown.split('\n')
  const result: string[] = []
  let inCodeBlock = false

  for (const line of lines) {
    const fenceMatch = line.match(/^```(\w*)/)

    if (fenceMatch) {
      if (inCodeBlock) {
        if (fenceMatch[1]) {
          result.push('```')
        }
        inCodeBlock = !!fenceMatch[1]
      } else {
        inCodeBlock = !!fenceMatch[1]
      }
      result.push(line)
      continue
    }

    if (inCodeBlock && patterns.some((pattern) => pattern.test(line))) {
      result.push('```')
      inCodeBlock = false
    }

    result.push(line)
  }

  if (inCodeBlock) {
    result.push('```')
  }

  return result.join('\n')
}

// Helper that uses Rust patterns (the common case for these tests)
const fixRust = (markdown: string) => fixUnclosedCodeBlocks(markdown, rustMarkdownPatterns)
const fixDefault = (markdown: string) => fixUnclosedCodeBlocks(markdown, defaultMarkdownPatterns)

test('fixUnclosedCodeBlocks: properly closed code block unchanged', () => {
  const input = `# Example

\`\`\`rust
let x = 1;
\`\`\`

More text.`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "# Example

    \`\`\`rust
    let x = 1;
    \`\`\`

    More text."
  `)
})

test('fixUnclosedCodeBlocks: unclosed code block at end gets closed', () => {
  const input = `# Example

\`\`\`rust
let x = 1;`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "# Example

    \`\`\`rust
    let x = 1;
    \`\`\`"
  `)
})

test('fixUnclosedCodeBlocks: heading inside code block closes it', () => {
  const input = `\`\`\`rust
let x = 1;

# This is a heading

More text.`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "\`\`\`rust
    let x = 1;

    \`\`\`
    # This is a heading

    More text."
  `)
})

test('fixUnclosedCodeBlocks: new code block starts without closing previous', () => {
  const input = `\`\`\`rust
let x = 1;

\`\`\`python
y = 2`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "\`\`\`rust
    let x = 1;

    \`\`\`
    \`\`\`python
    y = 2
    \`\`\`"
  `)
})

test('fixUnclosedCodeBlocks: Rust stdlib style with heading between unclosed blocks', () => {
  const input = `# Examples

\`\`\`should_panic
let x: Result<u32, &str> = Err("emergency failure");
x.expect("Testing expect");

# Recommended Message Style

We recommend that \`expect\` messages are used.

\`\`\`should_panic
let path = std::env::var("IMPORTANT_PATH").expect("should be set");`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "# Examples

    \`\`\`should_panic
    let x: Result<u32, &str> = Err("emergency failure");
    x.expect("Testing expect");

    \`\`\`
    # Recommended Message Style

    We recommend that \`expect\` messages are used.

    \`\`\`should_panic
    let path = std::env::var("IMPORTANT_PATH").expect("should be set");
    \`\`\`"
  `)
})

test('fixUnclosedCodeBlocks: bold text inside code block closes it', () => {
  const input = `\`\`\`rust
let x = 1;

**Hint**: This is important.`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "\`\`\`rust
    let x = 1;

    \`\`\`
    **Hint**: This is important."
  `)
})

test('fixUnclosedCodeBlocks: blockquote inside code block closes it', () => {
  const input = `\`\`\`rust
let x = 1;

> This is a quote.`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "\`\`\`rust
    let x = 1;

    \`\`\`
    > This is a quote."
  `)
})

test('fixUnclosedCodeBlocks: multiple headings levels detected', () => {
  const input = `\`\`\`rust
code

## H2 heading

more text

### H3 heading`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "\`\`\`rust
    code

    \`\`\`
    ## H2 heading

    more text

    ### H3 heading"
  `)
})

test('fixUnclosedCodeBlocks: code block without language is not opened', () => {
  const input = `Some text

\`\`\`
plain code
\`\`\`

More text.`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "Some text

    \`\`\`
    plain code
    \`\`\`

    More text."
  `)
})

test('fixUnclosedCodeBlocks: complex real-world Rust doc example', () => {
  const input = `Returns the contained [\`Ok\`] value, consuming the \`self\` value.

# Panics

Panics if the value is an [\`Err\`].

# Examples

\`\`\`should_panic
let x: Result<u32, &str> = Err("failure");
x.expect("Testing");

# Recommended Style

We recommend that \`expect\` messages describe why.

\`\`\`should_panic
let path = std::env::var("PATH").expect("PATH should be set");

**Hint**: Focus on the word "should".

For more detail, see the docs.`

  expect(fixRust(input)).toMatchInlineSnapshot(`
    "Returns the contained [\`Ok\`] value, consuming the \`self\` value.

    # Panics

    Panics if the value is an [\`Err\`].

    # Examples

    \`\`\`should_panic
    let x: Result<u32, &str> = Err("failure");
    x.expect("Testing");

    \`\`\`
    # Recommended Style

    We recommend that \`expect\` messages describe why.

    \`\`\`should_panic
    let path = std::env::var("PATH").expect("PATH should be set");

    \`\`\`
    **Hint**: Focus on the word "should".

    For more detail, see the docs."
  `)
})

test('fixUnclosedCodeBlocks: Rust hidden code lines with # not treated as headings', () => {
  const input = `# Examples

\`\`\`rust
# use std::io;
# [cfg(not(target_family = "wasm"))]
{
    let x = 1;
}
\`\`\`

More text.`

  // The `# use` and `# [cfg` lines should NOT close the code block
  // because they are Rust hidden code markers, not markdown headings
  expect(fixRust(input)).toMatchInlineSnapshot(`
    "# Examples

    \`\`\`rust
    # use std::io;
    # [cfg(not(target_family = "wasm"))]
    {
        let x = 1;
    }
    \`\`\`

    More text."
  `)
})

test('fixUnclosedCodeBlocks: Rust attribute #[cfg] not treated as heading', () => {
  const input = `\`\`\`rust
#[cfg(not(target_family = "wasm"))]
fn example() {
    let x = 1;
}`

  // #[cfg...] should NOT close the code block
  expect(fixRust(input)).toMatchInlineSnapshot(`
    "\`\`\`rust
    #[cfg(not(target_family = "wasm"))]
    fn example() {
        let x = 1;
    }
    \`\`\`"
  `)
})

test('fixUnclosedCodeBlocks: real heading vs Rust hidden code', () => {
  const input = `\`\`\`rust
# use std::io;
let x = 1;

# Real Heading

This is text after.`

  // `# use` should NOT close (hidden code)
  // `# Real Heading` SHOULD close (actual markdown heading)
  expect(fixRust(input)).toMatchInlineSnapshot(`
    "\`\`\`rust
    # use std::io;
    let x = 1;

    \`\`\`
    # Real Heading

    This is text after."
  `)
})

test('defaultMarkdownPatterns vs rustMarkdownPatterns: lowercase heading', () => {
  const input = `\`\`\`rust
# use std::io;
let x = 1;
\`\`\``

  // Default patterns would close on `# use` (any non-whitespace after #)
  expect(fixDefault(input)).toMatchInlineSnapshot(`
    "\`\`\`rust
    \`\`\`
    # use std::io;
    let x = 1;
    \`\`\`"
  `)

  // Rust patterns require uppercase, so `# use` stays inside code block
  expect(fixRust(input)).toMatchInlineSnapshot(`
    "\`\`\`rust
    # use std::io;
    let x = 1;
    \`\`\`"
  `)
})

// Tests for reconstructDocs
test('reconstructDocs: returns undefined for undefined docs', () => {
  expect(reconstructDocs(undefined, [])).toBeUndefined()
})

test('reconstructDocs: returns docs unchanged when no tags', () => {
  const docs = 'Some documentation'
  expect(reconstructDocs(docs, undefined)).toBe(docs)
  expect(reconstructDocs(docs, [])).toBe(docs)
})

test('reconstructDocs: merges spurious scoped package tag and appends example', () => {
  // TypeScript incorrectly parses `@vocs/twoslash-rust` as tag @vocs with text /twoslash-rust
  const docs = 'Requires: `pnpm add '
  const tags: [string, string | undefined][] = [
    ['vocs', '/twoslash-rust`'],
    ['example', '```ts\ncode\n```'],
  ]

  expect(reconstructDocs(docs, tags)).toBe(
    'Requires: `pnpm add @vocs/twoslash-rust`\n\n**Example**\n\n```ts\ncode\n```',
  )
})

test('reconstructDocs: appends example tag content', () => {
  const docs = 'Some docs'
  const tags: [string, string | undefined][] = [
    ['example', '```ts\ncode\n```'],
    ['param', 'name - description'],
  ]

  expect(reconstructDocs(docs, tags)).toBe('Some docs\n\n**Example**\n\n```ts\ncode\n```')
})

test('reconstructDocs: does not merge tags without leading slash', () => {
  const docs = 'Some docs'
  const tags: [string, string | undefined][] = [['customtag', 'some value without leading slash']]

  expect(reconstructDocs(docs, tags)).toBe('Some docs')
})

test('reconstructDocs: handles multiple spurious tags', () => {
  const docs = 'Install: `npm i '
  const tags: [string, string | undefined][] = [
    ['scope1', '/pkg1` and `npm i '],
    ['scope2', '/pkg2`'],
  ]

  expect(reconstructDocs(docs, tags)).toBe('Install: `npm i @scope1/pkg1` and `npm i @scope2/pkg2`')
})

test('reconstructDocs: handles example tag with undefined docs', () => {
  const tags: [string, string | undefined][] = [['example', '```ts\nconst x = 1\n```']]

  expect(reconstructDocs(undefined, tags)).toBe('\n\n**Example**\n\n```ts\nconst x = 1\n```')
})

test('reconstructDocs: handles multiple example tags', () => {
  const docs = 'Description'
  const tags: [string, string | undefined][] = [
    ['example', '```ts\nexample1\n```'],
    ['example', '```ts\nexample2\n```'],
  ]

  expect(reconstructDocs(docs, tags)).toBe(
    'Description\n\n**Example**\n\n```ts\nexample1\n```\n\n**Example**\n\n```ts\nexample2\n```',
  )
})

function createFakeContext(lang = 'ts') {
  return {
    codeToHast(code: string) {
      return {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'pre',
            properties: { class: 'shiki' },
            children: [
              {
                type: 'element',
                tagName: 'code',
                properties: {},
                children: [{ type: 'text', value: `${lang}:${code}` }],
              },
            ],
          },
        ],
      }
    },
    options: { lang },
  } as any
}

test('rich: nodeStaticInfo stores popup payload in attrs instead of child nodes', () => {
  const renderer = rich()
  const token = { type: 'text', value: 'token' } as const

  if (typeof renderer.nodeStaticInfo !== 'function') throw new Error('expected nodeStaticInfo')

  const hover = {
    docs: 'Useful docs',
    tags: [],
    text: 'value: string',
  } as unknown as NodeHover

  const result = renderer.nodeStaticInfo.call(createFakeContext(), hover, token)

  expect(result).toMatchObject({
    type: 'element',
    tagName: 'span',
    properties: {
      class: 'twoslash-hover twoslash-popup-container',
    },
    children: [token],
  })
  if (result.type !== 'element') throw new Error('expected element')
  if (!result.properties) throw new Error('expected properties')

  expect(result.children).toEqual([token])
  expect(result.properties['data-v-twoslash-code-html']).toContain('twoslash-popup-code')
  expect(result.properties['data-v-twoslash-code-html']).toContain('ts:value: string')
  expect(result.properties['data-v-twoslash-code-html']).toContain('data-v-overflow-sentinel')
  expect(result.properties['data-v-twoslash-docs-html']).toContain('twoslash-popup-docs')
  expect(result.properties['data-v-twoslash-docs-html']).toContain('Useful docs')
})

test('rich: nodeQuery stores persisted popup payload in attrs', () => {
  const renderer = rich()
  const token = { type: 'text', value: 'token' } as const

  if (typeof renderer.nodeQuery !== 'function') throw new Error('expected nodeQuery')

  const query = {
    tags: [],
    text: 'fn(): Promise<void>',
  } as unknown as NodeQuery

  const result = renderer.nodeQuery.call(createFakeContext('tsx'), query, token)

  expect(result).toMatchObject({
    type: 'element',
    tagName: 'span',
    properties: {
      class: 'twoslash-hover twoslash-query-persisted twoslash-popup-container',
    },
    children: [token],
  })
  if (result.type !== 'element') throw new Error('expected element')
  if (!result.properties) throw new Error('expected properties')

  expect(result.properties['data-v-twoslash-code-html']).toContain(
    'tsx:function fn(): Promise&#x3C;void>',
  )
  expect(result.properties['data-v-twoslash-docs-html']).toBeUndefined()
})
