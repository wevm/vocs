import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, test } from 'vitest'
import { audit, format } from './markdown-audit.js'

describe('audit', () => {
  test('reports unrendered components by component, then page', async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-markdown-audit-'))
    const componentPath = path.join(rootDir, 'components.ts')
    const servicesPath = path.join(rootDir, 'services.mdx')
    const setupPath = path.join(rootDir, 'setup.mdx')

    try {
      fs.writeFileSync(
        componentPath,
        `export const Rendered = {
  toMarkdown: () => ({ type: 'paragraph', children: [{ type: 'text', value: 'Rendered.' }] }),
}

export function Image() { return null }

export const Button = {
  toMarkdown: () => ({ type: 'paragraph', children: [{ type: 'text', value: 'Button.' }] }),
}`,
      )
      fs.writeFileSync(
        servicesPath,
        `import { Button, Image, Rendered } from './components'

<Rendered />

<Image />

<Image />

<Button href="/docs" />`,
      )
      fs.writeFileSync(
        setupPath,
        `import { Image } from './components'

<Image />`,
      )

      const result = await audit({
        pages: [
          { content: { path: servicesPath }, path: '/services' },
          { content: { path: setupPath }, path: '/setup' },
        ],
      })

      expect(result).toEqual({
        components: [
          {
            count: 3,
            name: 'Image',
            pages: [
              { count: 2, path: '/services' },
              { count: 1, path: '/setup' },
            ],
            unsupportedUsages: 0,
          },
          {
            count: 1,
            name: 'Button',
            pages: [{ count: 1, path: '/services' }],
            unsupportedUsages: 1,
          },
        ],
        errors: [],
      })
      expect(format(result)).toMatchInlineSnapshot(`
        "[vocs] Markdown audit found 2 components left after dry rendering 2 pages (4 occurrences).

        Components:
          Image (3 occurrences)
            Fix: add \`Image.toMarkdown\` to return a Markdown AST node.
            /services (2 occurrences)
            /setup (1 occurrence)
          Button (1 occurrence)
            Fix: replace this prop or child usage with Markdown; \`toMarkdown\` only supports standalone components.
            /services (1 occurrence)"
      `)
    } finally {
      fs.rmSync(rootDir, { force: true, recursive: true })
    }
  })

  test('passes when generated Markdown contains no MDX components', async () => {
    const result = await audit({
      pages: [{ content: '# Hello\n\nMarkdown only.', path: '/' }],
    })

    expect(result).toEqual({ components: [], errors: [] })
    expect(format(result)).toBe('[vocs] Markdown audit passed. No unrendered MDX components found.')
  })
})
