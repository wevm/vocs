import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { createHighlighter } from 'shiki'
import { afterEach, expect, test, vi } from 'vitest'

import * as Langs from './langs.js'

const directories: string[] = []

afterEach(() => {
  vi.restoreAllMocks()
  for (const directory of directories) fs.rmSync(directory, { recursive: true, force: true })
  directories.length = 0
})

function createPages(pages: Record<string, string>) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-langs-'))
  directories.push(rootDir)
  for (const [file, content] of Object.entries(pages)) {
    const filePath = path.join(rootDir, 'src', 'pages', file)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content)
  }
  return { pagesDir: 'pages', rootDir, srcDir: 'src' }
}

test('skips fence languages that Shiki does not bundle', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const options = createPages({
    'index.md': '```promql\nrate(x[5m])\n```\n\n```python\nprint(1)\n```\n\n```py\nprint(2)\n```\n',
  })

  const langs = Langs.infer(options)

  expect(langs).not.toContain('promql')
  expect(langs).toContain('python')
  expect(langs).toContain('py')
})

test('keeps plain text fence languages', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const options = createPages({ 'index.md': '```text\nhello\n```\n' })

  expect(Langs.infer(options)).toContain('text')
  expect(warn).not.toHaveBeenCalled()
})

test('returns languages the highlighter can preload', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const options = createPages({ 'index.md': '```promql\nrate(x[5m])\n```\n' })

  // Config.resolve always aliases `sol`, which is one of the default languages.
  const highlighter = await createHighlighter({
    langAlias: { sol: 'solidity' },
    langs: Langs.infer(options),
    themes: [],
  })

  expect(highlighter.getLoadedLanguages()).toContain('ts')
  highlighter.dispose()
})

test('keeps fence languages with a configured alias', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const options = createPages({ 'index.md': '```promql\nrate(x[5m])\n```\n' })

  expect(Langs.infer({ ...options, langAlias: { promql: 'python' } })).toContain('promql')
  expect(warn).not.toHaveBeenCalled()
})

test('warns once with the file that uses the language', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const options = createPages({ 'guides/metrics.md': '```notalanguage\nx\n```\n' })

  Langs.infer(options)
  Langs.infer(options)

  expect(warn).toHaveBeenCalledTimes(1)
  expect(warn.mock.calls[0]?.[0]).toContain('notalanguage')
  expect(warn.mock.calls[0]?.[0]).toContain(path.join('guides', 'metrics.md'))
})
