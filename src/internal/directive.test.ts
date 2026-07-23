import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, test } from 'vitest'
import * as Directive from './directive.js'

describe('load', () => {
  test('loads directives from `_directives.tsx`', async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-directives-'))
    const pagesDir = path.join(rootDir, 'src/pages')
    fs.mkdirSync(pagesDir, { recursive: true })
    fs.writeFileSync(
      path.join(pagesDir, '_directives.tsx'),
      `export const directives = [
        {
          name: 'stats',
          toMarkdown: () => 'Stats',
        },
      ]`,
    )

    const directives = await Directive.load({
      config: { rootDir, srcDir: 'src', pagesDir: 'pages' },
    })

    expect(directives).toHaveLength(1)
    expect(directives[0]?.name).toBe('stats')
    expect(await directives[0]?.toMarkdown?.({})).toBe('Stats')
  })

  test('returns nothing without a `_directives.tsx`', async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-directives-'))

    expect(await Directive.load({ config: { rootDir, srcDir: 'src', pagesDir: 'pages' } })).toEqual(
      [],
    )
  })
})

describe('resolve', () => {
  test('user directives come before built-ins', () => {
    const user = { name: 'stats', toMarkdown: () => 'Stats' }
    const resolved = Directive.resolve({ config: {}, directives: [user] })

    expect(resolved[0]).toBe(user)
    expect(resolved.at(-1)?.name).toBe('changelog')
    expect(resolved.at(-1)?.builtin).toBe(true)
  })
})
