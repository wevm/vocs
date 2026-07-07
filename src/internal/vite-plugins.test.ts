import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import type { ResolvedConfig } from 'vite'
import { afterEach, describe, expect, test } from 'vitest'
import type * as Config from './config.js'
import { resolveSitemapInclude, resolveSitemapLastmod, sitemap } from './vite-plugins.js'

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

  test('supports route-aware sitemap config', async () => {
    const fixture = await createFixture()
    await fs.mkdir(path.join(fixture.rootDir, 'src/pages/docs'), { recursive: true })
    await fs.writeFile(path.join(fixture.rootDir, 'src/pages/docs/index.mdx'), '# Docs\n')
    await fs.writeFile(path.join(fixture.rootDir, 'src/pages/blog.mdx'), '# Blog\n')
    const plugin = createSitemapPlugin(fixture.rootDir, fixture.publicDir, {
      sitemap: {
        include: (path) => path !== '/blog',
        lastmod: (path, { lastmod }) => (path.startsWith('/docs') ? false : lastmod),
      },
    })

    await plugin.writeBundle({ dir: fixture.outDir })

    const sitemapXml = await fs.readFile(path.join(fixture.outDir, 'sitemap.xml'), 'utf-8')
    expect(sitemapXml).toContain('<loc>https://example.com/docs</loc>')
    expect(sitemapXml).not.toContain('<loc>https://example.com/blog</loc>')
    expect(sitemapXml).not.toMatch(
      /<url>\n\s*<loc>https:\/\/example\.com\/docs<\/loc>\n\s*<lastmod>/,
    )
  })

  test('supports lastmod overrides', async () => {
    const fixture = await createFixture()
    await fs.writeFile(path.join(fixture.rootDir, 'src/pages/changelog.mdx'), '# Changelog\n')
    const plugin = createSitemapPlugin(fixture.rootDir, fixture.publicDir, {
      sitemap: {
        lastmod: (path, { lastmod }) => (path === '/changelog' ? '2025-01-01' : lastmod),
      },
    })

    await plugin.writeBundle({ dir: fixture.outDir })

    const sitemapXml = await fs.readFile(path.join(fixture.outDir, 'sitemap.xml'), 'utf-8')
    expect(sitemapXml).toMatch(
      /<url>\n\s*<loc>https:\/\/example\.com\/changelog<\/loc>\n\s*<lastmod>2025-01-01<\/lastmod>\n\s*<\/url>/,
    )
  })

  test('disables generated sitemap and robots files', async () => {
    const fixture = await createFixture()
    const plugin = createSitemapPlugin(fixture.rootDir, fixture.publicDir, { sitemap: false })

    await plugin.writeBundle({ dir: fixture.outDir })

    await expect(fs.access(path.join(fixture.outDir, 'sitemap.xml'))).rejects.toThrow()
    await expect(fs.access(path.join(fixture.outDir, 'robots.txt'))).rejects.toThrow()
  })
})

describe('sitemap config helpers', () => {
  test('resolves include config', () => {
    expect(resolveSitemapInclude({ sitemap: false }, '/docs', 'docs/index.mdx')).toBe(false)
    expect(resolveSitemapInclude({ sitemap: { include: false } }, '/docs', 'docs/index.mdx')).toBe(
      false,
    )
    expect(
      resolveSitemapInclude(
        { sitemap: { include: (path) => path.startsWith('/docs') } },
        '/docs',
        'docs/index.mdx',
      ),
    ).toBe(true)
  })

  test('resolves lastmod config', () => {
    expect(resolveSitemapLastmod({ sitemap: false }, '/docs', 'docs/index.mdx', '2026-01-01')).toBe(
      undefined,
    )
    expect(
      resolveSitemapLastmod(
        { sitemap: { lastmod: false } },
        '/docs',
        'docs/index.mdx',
        '2026-01-01',
      ),
    ).toBe(undefined)
    expect(
      resolveSitemapLastmod(
        { sitemap: { lastmod: () => '2025-01-01' } },
        '/docs',
        'docs/index.mdx',
        '2026-01-01',
      ),
    ).toBe('2025-01-01')
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

function createSitemapPlugin(
  rootDir: string,
  publicDir: string,
  config: Partial<Config.Config> = {},
) {
  const plugin = sitemap({
    baseUrl: 'https://example.com',
    pagesDir: 'pages',
    srcDir: 'src',
    ...config,
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
