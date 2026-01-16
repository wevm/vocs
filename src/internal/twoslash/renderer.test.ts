import { expect, test } from 'vitest'
import { defaultMarkdownPatterns, rustMarkdownPatterns } from './renderer.js'

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
