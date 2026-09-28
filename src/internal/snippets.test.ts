import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { createPhysicalSourceGetter, processIncludes } from './snippets.js'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true })
  tempDirs.length = 0
})

describe('physical snippet includes', () => {
  test('reads a file inside the source directory', () => {
    const { getSource, sourceDir } = createFixture()
    fs.writeFileSync(path.join(sourceDir, 'example.ts'), 'export const value = 1\n')

    expect(getSource('~/example.ts')).toBe('export const value = 1')
    expect(processIncludes({ code: '// [!include ~/example.ts]', getSource })).toBe(
      'export const value = 1',
    )
  })

  test.each([
    '~/../secret.txt',
    '~/../../secret.txt',
    '~/other/../../../secret.txt',
    '~../../secret.txt',
  ])('rejects traversal through %s', (include) => {
    const { getSource, rootDir, sourceDir } = createFixture()
    fs.mkdirSync(path.join(sourceDir, 'other'))
    fs.writeFileSync(path.join(rootDir, 'secret.txt'), 'private data')

    expect(getSource(include)).toBeUndefined()
    expect(processIncludes({ code: `// [!include ${include}]`, getSource })).not.toContain(
      'private data',
    )
  })

  test('rejects symlinked files and directories outside the source directory', () => {
    const { getSource, rootDir, sourceDir } = createFixture()
    fs.writeFileSync(path.join(rootDir, 'secret.txt'), 'private data')
    fs.symlinkSync(path.join(rootDir, 'secret.txt'), path.join(sourceDir, 'linked.txt'))
    fs.symlinkSync(rootDir, path.join(sourceDir, 'linked-dir'))

    expect(getSource('~/linked.txt')).toBeUndefined()
    expect(getSource('~/linked-dir/secret.txt')).toBeUndefined()
  })
})

function createFixture() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocs-snippets-'))
  tempDirs.push(rootDir)
  const sourceDir = path.join(rootDir, 'src')
  fs.mkdirSync(sourceDir)
  return {
    getSource: createPhysicalSourceGetter({ rootDir, srcDir: 'src' }),
    rootDir,
    sourceDir,
  }
}
