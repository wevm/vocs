import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import * as Langs from './langs.js'

let rootDir: string

beforeEach(() => {
  rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-langs-'))
  fs.mkdirSync(path.join(rootDir, 'src', 'pages'), { recursive: true })
})

afterEach(() => {
  fs.rmSync(rootDir, { recursive: true, force: true })
})

describe('infer', () => {
  test('excludes semantic fences', () => {
    fs.writeFileSync(
      path.join(rootDir, 'src', 'pages', 'index.mdx'),
      '```prompt\nSummarize this.\n```\n\n```ruby\nputs "Hello"\n```',
    )

    const langs = Langs.infer({ rootDir, srcDir: 'src', pagesDir: 'pages' })

    expect(langs).toContain('ruby')
    expect(langs).not.toContain('prompt')
  })
})
