import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { Hono } from 'hono'
import { afterEach, describe, expect, test } from 'vitest'
import { serveStaticWithinRoot } from './serve-static.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })))
  tempDirs.length = 0
})

describe('static output boundary', () => {
  test('serves regular files and in-root links', async () => {
    const { root } = await createFixture()
    await fs.writeFile(path.join(root, 'safe.txt'), 'public marker')
    await fs.symlink('safe.txt', path.join(root, 'linked.txt'))
    const app = new Hono()
    app.use('*', serveStaticWithinRoot({ root }))

    for (const url of ['/safe.txt', '/linked.txt']) {
      const response = await app.request(url)
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('public marker')
    }
  })

  test.each(['file', 'directory', 'index'])('rejects an escaping %s link', async (kind) => {
    const { root, parent } = await createFixture()
    const secret = path.join(parent, 'secret.txt')
    await fs.writeFile(secret, 'private marker')
    let url = '/leak.txt'
    if (kind === 'file') await fs.symlink(secret, path.join(root, 'leak.txt'))
    if (kind === 'directory') {
      await fs.mkdir(path.join(parent, 'outside'))
      await fs.writeFile(path.join(parent, 'outside', 'secret.txt'), 'private marker')
      await fs.symlink(path.join(parent, 'outside'), path.join(root, 'outside'))
      url = '/outside/secret.txt'
    }
    if (kind === 'index') {
      await fs.mkdir(path.join(root, 'nested'))
      await fs.symlink(secret, path.join(root, 'nested', 'index.html'))
      url = '/nested/'
    }
    const app = new Hono()
    app.use('*', serveStaticWithinRoot({ root }))

    const response = await app.request(url)
    expect(response.status).toBe(404)
    expect(await response.text()).not.toContain('private marker')
  })

  test('preserves base-path rewriting', async () => {
    const { root } = await createFixture()
    await fs.writeFile(path.join(root, 'safe.txt'), 'public marker')
    const app = new Hono()
    app.use('/docs/*', serveStaticWithinRoot({ root, rewriteRequestPath: (url) => url.slice(5) }))

    const response = await app.request('/docs/safe.txt')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('public marker')
  })
})

async function createFixture() {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-static-boundary-'))
  tempDirs.push(parent)
  const root = path.join(parent, 'public')
  await fs.mkdir(root)
  return { parent, root }
}
