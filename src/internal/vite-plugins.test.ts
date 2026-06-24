import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import type { ResolvedConfig } from 'vite'
import { afterEach, describe, expect, test } from 'vitest'
import type * as Config from './config.js'
import { sitemap } from './vite-plugins.js'

const tempDirs = new Set<string>()

afterEach(async () => {
  await Promise.all([...tempDirs].map((dir) => fs.rm(dir, { force: true, recursive: true })))
  tempDirs.clear()
})

describe('sitemap', () => {
  test('generates robots.txt and sitemap.xml when public files do not exist', async () => {
    const fixture = await createFixture()
    const plugin = createSitemapPlugin(fixture.rootDir, fixture.publicDir)

    await plugin.writeBundle({ dir: fixture.outDir })

    await expect(fs.readFile(path.join(fixture.outDir, 'robots.txt'), 'utf-8')).resolves.toContain(
      'Sitemap: https://example.com/sitemap.xml',
    )
    await expect(fs.readFile(path.join(fixture.outDir, 'sitemap.xml'), 'utf-8')).resolves.toContain(
      '<loc>https://example.com/</loc>',
    )
  })

  test('preserves public robots.txt', async () => {
    const fixture = await createFixture()
    const plugin = createSitemapPlugin(fixture.rootDir, fixture.publicDir)
    const robots = 'User-agent: *\nContent-Signal: ai-train=yes, search=yes, ai-input=yes\n'

    await fs.writeFile(path.join(fixture.publicDir, 'robots.txt'), robots)
    await fs.writeFile(path.join(fixture.outDir, 'robots.txt'), robots)
    await plugin.writeBundle({ dir: fixture.outDir })

    await expect(fs.readFile(path.join(fixture.outDir, 'robots.txt'), 'utf-8')).resolves.toBe(
      robots,
    )
    await expect(fs.readFile(path.join(fixture.outDir, 'sitemap.xml'), 'utf-8')).resolves.toContain(
      '<loc>https://example.com/</loc>',
    )
  })

  test('preserves public sitemap.xml', async () => {
    const fixture = await createFixture()
    const plugin = createSitemapPlugin(fixture.rootDir, fixture.publicDir)
    const sitemapXml = '<urlset><url><loc>https://custom.example/</loc></url></urlset>\n'

    await fs.writeFile(path.join(fixture.publicDir, 'sitemap.xml'), sitemapXml)
    await fs.writeFile(path.join(fixture.outDir, 'sitemap.xml'), sitemapXml)
    await plugin.writeBundle({ dir: fixture.outDir })

    await expect(fs.readFile(path.join(fixture.outDir, 'sitemap.xml'), 'utf-8')).resolves.toBe(
      sitemapXml,
    )
    await expect(fs.readFile(path.join(fixture.outDir, 'robots.txt'), 'utf-8')).resolves.toContain(
      'Sitemap: https://example.com/sitemap.xml',
    )
  })
})

async function createFixture() {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-sitemap-'))
  tempDirs.add(rootDir)

  const pagesDir = path.join(rootDir, 'src/pages')
  const publicDir = path.join(rootDir, 'public')
  const outDir = path.join(rootDir, 'dist/public')
  await fs.mkdir(pagesDir, { recursive: true })
  await fs.mkdir(publicDir, { recursive: true })
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(pagesDir, 'index.mdx'), '# Hello\n')

  return { outDir, publicDir, rootDir }
}

function createSitemapPlugin(rootDir: string, publicDir: string) {
  const plugin = sitemap({
    baseUrl: 'https://example.com',
    pagesDir: 'pages',
    srcDir: 'src',
  } as Config.Config) as unknown as {
    configResolved(config: ResolvedConfig): void
    writeBundle(options: { dir: string }): Promise<void>
  }

  plugin.configResolved({
    command: 'build',
    publicDir,
    root: rootDir,
  } as ResolvedConfig)

  return plugin
}
