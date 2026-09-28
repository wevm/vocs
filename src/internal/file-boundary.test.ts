import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { resolveConfig } from 'vite'
import { afterEach, describe, expect, test } from 'vitest'
import * as Config from './config.js'
import { assertSafeContentSymlinks } from './file-boundary.js'
import { fileBoundaries } from './vite-plugins.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })))
  tempDirs.length = 0
})

describe('content symlink boundaries', () => {
  test('allows links that stay inside their content directory', async () => {
    const { config, pagesDir, publicDir } = await createFixture()
    await fs.writeFile(path.join(pagesDir, 'page.mdx'), '# Public page')
    await fs.writeFile(path.join(publicDir, 'asset.txt'), 'Public asset')
    await fs.symlink('page.mdx', path.join(pagesDir, 'linked.mdx'))
    await fs.symlink('asset.txt', path.join(publicDir, 'linked.txt'))

    await expect(assertSafeContentSymlinks(config)).resolves.toBeUndefined()
  })

  test.each([
    'pages',
    'public',
  ])('rejects a %s file link to a private project file', async (dir) => {
    const { config, rootDir, pagesDir, publicDir } = await createFixture()
    const secret = path.join(rootDir, 'secret.txt')
    await fs.writeFile(secret, 'private marker')
    await fs.symlink(secret, path.join(dir === 'pages' ? pagesDir : publicDir, 'leak.txt'))

    await expect(assertSafeContentSymlinks(config)).rejects.toThrow('Content symlink escapes')
  })

  test('rejects a directory link that escapes through nested content', async () => {
    const { config, rootDir, pagesDir } = await createFixture()
    await fs.mkdir(path.join(pagesDir, 'nested'))
    await fs.symlink(rootDir, path.join(pagesDir, 'nested', 'outside'))

    await expect(assertSafeContentSymlinks(config)).rejects.toThrow('Content symlink escapes')
  })

  test('rejects a symlinked content directory at Vite startup', async () => {
    const { config, rootDir, pagesDir } = await createFixture()
    await fs.rm(pagesDir, { recursive: true })
    await fs.mkdir(path.join(rootDir, 'other-pages'))
    await fs.symlink(path.join(rootDir, 'other-pages'), pagesDir)

    await expect(
      resolveConfig(
        { root: rootDir, configFile: false, plugins: [fileBoundaries(config)] },
        'build',
      ),
    ).rejects.toThrow('Content directory is a symlink')
  })
})

async function createFixture() {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-content-boundary-'))
  tempDirs.push(rootDir)
  const pagesDir = path.join(rootDir, 'src', 'pages')
  const publicDir = path.join(rootDir, 'public')
  await fs.mkdir(pagesDir, { recursive: true })
  await fs.mkdir(publicDir)
  return { config: Config.define({ rootDir }), pagesDir, publicDir, rootDir }
}
