import * as fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as path from 'node:path'
import { compile } from 'tailwindcss'
import { describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)

async function build(css: string, candidates: string[]) {
  const compiler = await compile(css, {
    base: import.meta.dirname,
    async loadStylesheet(id, base) {
      // Bare specifiers resolve through Node, so `vocs/styles/theme.css` goes
      // through `package.json#exports` like it does for a consuming site.
      const resolved = id.startsWith('.') ? path.resolve(base, id) : require.resolve(id)
      return {
        base: path.dirname(resolved),
        content: await fs.readFile(resolved, 'utf-8'),
        path: resolved,
      }
    },
  })
  return compiler.build(candidates)
}

describe('theme.css', () => {
  test('keeps the importing site palette', async () => {
    const css = await build(
      `@import 'tailwindcss/theme.css';
       @import 'vocs/styles/theme.css';
       @import 'tailwindcss/utilities.css';`,
      ['bg-red-500', 'text-zinc-600', 'bg-surface', 'text-heading', 'border-primary'],
    )
    expect(css).toContain('.bg-red-500')
    expect(css).toContain('.text-zinc-600')
    expect(css).toContain('.bg-surface')
    expect(css).toContain('.text-heading')
    expect(css).toContain('.border-primary')
  })
})

describe('index.css', () => {
  test('resets the default palette for vocs utilities', async () => {
    const css = await build(`@import './index.css';`, [
      'vocs:bg-red-500',
      'vocs:bg-surface',
      'vocs:text-heading',
    ])
    expect(css).not.toContain('bg-red-500')
    expect(css).not.toContain('--vocs-color-red-500')
    expect(css).toContain('.vocs\\:bg-surface')
    expect(css).toContain('.vocs\\:text-heading')
  })
})
