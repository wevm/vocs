import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import tailwind from '@tailwindcss/vite'
import { build } from 'vite'
import { expect, test } from 'vitest'

test('builds prefixed Vocs utilities alongside consumer Tailwind utilities', async () => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-tailwind-')))
  const vocs = path.resolve(import.meta.dirname, 'index.css')
  const tailwindCss = import.meta.resolve('tailwindcss/index.css')
  try {
    await fs.writeFile(
      path.join(root, 'index.html'),
      '<link rel="stylesheet" href="/vocs.css"><link rel="stylesheet" href="/styles.css"><div class="vocs:p-7 p-11 md:p-12 vocs:rounded-xl rounded-full"></div>',
    )
    await fs.writeFile(path.join(root, 'vocs.css'), `@import ${JSON.stringify(vocs)};`)
    await fs.writeFile(
      path.join(root, 'styles.css'),
      `@import ${JSON.stringify(new URL(tailwindCss).pathname)};\n@source "./index.html";`,
    )
    const result = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [tailwind()],
      build: { write: false, cssMinify: false },
    })
    if (Array.isArray(result) || !('output' in result)) throw new Error('Expected one build output')
    const css = result.output.find(
      (item) => item.type === 'asset' && item.fileName.endsWith('.css'),
    )
    if (!css || css.type !== 'asset') throw new Error('Missing stylesheet')
    const source = String(css.source)
    expect(source.indexOf('@layer vocs_utilities {')).toBeLessThan(
      source.indexOf('@layer utilities {'),
    )
    expect(source).toMatch(/\.vocs\\:p-7\s*\{\s*padding: calc\(var\(--vocs-spacing\) \* 7\)/)
    expect(source).toMatch(/\.p-11\s*\{\s*padding: calc\(var\(--spacing\) \* 11\)/)
    expect(source).toContain('.md\\:p-12')
    expect(source).toContain('.vocs\\:rounded-xl')
    expect(source).toContain('.rounded-full')
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
