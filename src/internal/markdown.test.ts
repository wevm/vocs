import { describe, expect, it } from 'vitest'
import * as Markdown from './markdown.js'

describe('toText', () => {
  it('strips frontmatter and Markdown syntax to plain text', async () => {
    const md =
      '---\nurl: /vue/guides/viem.md\n---\n# Viem\n\n[Viem](https://viem.sh) is a low-level TypeScript Interface for Ethereum.'
    const text = await Markdown.toText(md)
    expect(text).not.toContain('---')
    expect(text).not.toContain('url:')
    expect(text).not.toContain('](https://viem.sh)')
    expect(text).toContain('Viem')
    expect(text).toContain('is a low-level TypeScript Interface for Ethereum.')
  })

  it('collapses a Markdown link to its text', async () => {
    expect(await Markdown.toText('See [the docs](https://x.com/docs) here.')).toBe(
      'See the docs here.',
    )
  })

  it('keeps a word boundary between blocks', async () => {
    expect(await Markdown.toText('# Title\n\nBody text')).toBe('Title Body text')
  })

  it('unwraps directives and JSX, keeping child text', async () => {
    expect(await Markdown.toText(':::note\nHello **world**\n:::')).toBe('Hello world')
    expect(await Markdown.toText('# Title\n\n<Foo bar="x">inner</Foo> tail')).toBe(
      'Title inner tail',
    )
  })

  it('returns an empty string for undefined', async () => {
    expect(await Markdown.toText(undefined)).toBe('')
  })
})
