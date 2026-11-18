import { expect, test } from 'vitest'
import * as LlmsFormat from './llms-format.js'

const pages = [
  { path: '/', title: 'Home', description: 'Start  here.', content: '# Home\n' },
  { path: '/guide/', title: 'Guide [beta]', content: '# Guide\n' },
]

test('index links each page’s Markdown under the runtime origin', () => {
  expect(
    LlmsFormat.index({
      origin: 'https://preview-1.example.com',
      title: 'Example',
      description: 'Docs for Example.',
      preamble: '## Pages',
      pages,
    }),
  ).toMatchInlineSnapshot(`
    "# Example

    Docs for Example.

    ## Pages

    - [Home](https://preview-1.example.com/index.md): Start here.
    - [Guide \\[beta\\]](https://preview-1.example.com/guide.md)"
  `)
})

test('full holds each page under its source URL', () => {
  expect(
    LlmsFormat.full({ origin: 'https://example.com', title: 'Example', pages }),
  ).toMatchInlineSnapshot(`
      "# Example

      <!--
      Sitemap:
      - [Home](https://example.com/index.md): Start here.
      - [Guide \\[beta\\]](https://example.com/guide.md)
      -->

      <!-- Source: https://example.com/ -->

      # Home

      <!-- Source: https://example.com/guide/ -->

      # Guide
      "
    `)
  expect(LlmsFormat.full({ title: 'Example', index: '# Custom', pages: pages.slice(1) })).toBe(
    '# Custom\n\n<!-- Source: /guide/ -->\n\n# Guide\n',
  )
})
