import { createHash } from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Hono } from 'hono'
import {
  build,
  createServer,
  isFileServingAllowed,
  isRunnableDevEnvironment,
  type ResolvedConfig,
  resolveConfig,
} from 'vite'
import { afterEach, describe, expect, test, vi } from 'vitest'
import * as MdRouter from '../waku/internal/middleware/md-router.js'
import * as Config from './config.js'
import * as Llms from './llms.js'
import type * as OpenApi from './openapi/index.js'
import * as OpenApiSpec from './openapi/openapi.js'
import * as OpenApiRegistry from './openapi/registry.js'
import {
  cacheProtection,
  deps,
  llms,
  openapi,
  openapiClientDocument,
  openapiClientManifest,
  openapiSchemaModelsDocument,
  openapiSchemaModelsManifest,
  resolveSitemapInclude,
  resolveSitemapLastmod,
  sitemap,
} from './vite-plugins.js'

describe('dependencies', () => {
  test.each([false, true])('prebundles Mermaid only when installed: %s', async (installed) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-deps-'))
    tempDirs.add(root)
    if (installed) {
      await fs.mkdir(path.join(root, 'node_modules'))
      await fs.symlink(
        path.dirname(fileURLToPath(import.meta.resolve('mermaid/package.json'))),
        path.join(root, 'node_modules/mermaid'),
        'junction',
      )
    }

    const resolved = await resolveConfig(
      {
        root,
        configFile: false,
        plugins: [deps()],
        optimizeDeps: { include: ['custom-dependency'] },
      },
      'serve',
    )

    expect(resolved.optimizeDeps.include?.includes('mermaid')).toBe(installed)
    expect(resolved.environments['client']?.optimizeDeps.include?.includes('mermaid')).toBe(
      installed,
    )
    expect(resolved.optimizeDeps.include).toContain('custom-dependency')
  })
})

describe('cache protection', () => {
  test('denies cache files while preserving normal files and Vite defaults', async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-cache-protection-'))
    tempDirs.add(rootDir)
    const cacheDir = path.join(rootDir, 'node_modules/.cache/vocs')
    await fs.mkdir(cacheDir, { recursive: true })
    await fs.writeFile(path.join(cacheDir, 'private.json'), 'private')
    await fs.writeFile(path.join(rootDir, 'public.json'), 'public')
    await fs.writeFile(path.join(rootDir, '.env'), 'SECRET=private')

    const resolved = await resolveConfig(
      { root: rootDir, configFile: false, plugins: [cacheProtection(cacheDir)] },
      'serve',
    )

    expect(isFileServingAllowed(resolved, path.join(cacheDir, 'private.json'))).toBe(false)
    expect(isFileServingAllowed(resolved, path.join(rootDir, '.env'))).toBe(false)
    expect(isFileServingAllowed(resolved, path.join(rootDir, 'public.json'))).toBe(true)
  })
})

const tempDirs = new Set<string>()

test('builds Markdown exports once after the client output', async () => {
  const rootDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-llms-build-')))
  tempDirs.add(rootDir)
  await fs.mkdir(path.join(rootDir, 'src/pages'), { recursive: true })
  await fs.writeFile(path.join(rootDir, 'src/pages/index.mdx'), '# Hello')
  await fs.writeFile(path.join(rootDir, 'index.html'), '<html><body>Hello</body></html>')
  await fs.writeFile(path.join(rootDir, 'server.js'), 'export const hello = "world"')
  await fs.mkdir(path.join(rootDir, 'dist/public'), { recursive: true })
  await fs.writeFile(path.join(rootDir, 'dist/public/stale.txt'), 'old output')

  const config = Config.define({
    rootDir,
    srcDir: 'src',
    outDir: 'dist',
    title: 'Docs',
    codeHighlight: { langs: [] },
  })
  const scan = vi.spyOn(Llms, 'getPagesFromDir')
  const options = { root: rootDir, configFile: false as const, logLevel: 'silent' as const }

  await build({
    ...options,
    plugins: [llms(config)],
    build: { ssr: 'server.js', outDir: 'dist/server' },
  })
  expect(scan).not.toHaveBeenCalled()

  await build({
    ...options,
    plugins: [llms(config)],
    build: { outDir: 'dist/public', emptyOutDir: true },
  })
  expect(scan).toHaveBeenCalledTimes(1)
  await expect(fs.access(path.join(rootDir, 'dist/public/stale.txt'))).rejects.toThrow()
  await expect(fs.readFile(path.join(rootDir, 'dist/public/llms.txt'), 'utf-8')).resolves.toContain(
    '# Docs',
  )
  await expect(
    fs.readFile(path.join(rootDir, 'dist/public/llms-full.txt'), 'utf-8'),
  ).resolves.toContain('# Hello')
  await expect(
    fs.readFile(path.join(rootDir, 'dist/public/assets/md/index.md'), 'utf-8'),
  ).resolves.toContain('# Hello')
})

test.each([
  ['warn', undefined, false],
  ['fail', undefined, true],
  ['fail', 'warn', false],
] as const)('enforces Markdown mode %s with override %s', async (validation, override, rejects) => {
  const rootDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-output-mode-')))
  tempDirs.add(rootDir)
  await fs.mkdir(path.join(rootDir, 'src/pages'), { recursive: true })
  await fs.writeFile(path.join(rootDir, 'src/pages/index.mdx'), '# Hello\n\n<Unknown />')
  await fs.writeFile(path.join(rootDir, 'index.html'), '<html><body>Hello</body></html>')
  vi.stubEnv('VOCS_MARKDOWN_VALIDATION', override)
  try {
    const config = Config.define({
      rootDir,
      title: 'Docs',
      codeHighlight: { langs: [] },
      markdown: { output: { validation } },
    })
    const run = build({
      root: rootDir,
      configFile: false,
      logLevel: 'silent',
      plugins: [llms(config)],
      build: { outDir: 'dist/public' },
    })
    if (rejects) await expect(run).rejects.toThrow('unhandled-component')
    else {
      await run
      const manifest = JSON.parse(
        await fs.readFile(path.join(rootDir, 'dist/public/markdown-manifest.json'), 'utf8'),
      )
      expect(Object.keys(manifest.files)).toEqual(['/index.md', '/llms-full.txt', '/llms.txt'])
      expect(await fs.readFile(path.join(rootDir, 'dist/public/llms-full.txt'), 'utf8')).toContain(
        '<Unknown />',
      )
    }
  } finally {
    vi.unstubAllEnvs()
  }
})

test('uses final transforms in development and fingerprints their production bytes', async () => {
  const rootDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-transform-')))
  tempDirs.add(rootDir)
  await fs.mkdir(path.join(rootDir, 'src/pages'), { recursive: true })
  await fs.writeFile(
    path.join(rootDir, 'component.ts'),
    `export const markdown = { Panel: () => [{ type: 'paragraph', children: [{ type: 'text', value: 'Alias rendered' }] }] }`,
  )
  await fs.writeFile(
    path.join(rootDir, 'src/pages/index.mdx'),
    "import { Panel } from 'site-components'\n\n# Hello\n\n<Panel />",
  )
  await fs.writeFile(path.join(rootDir, 'index.html'), '<html><body>Hello</body></html>')
  const config = Config.define({
    rootDir,
    title: 'Docs',
    codeHighlight: { langs: [] },
    markdown: {
      output: {
        validation: 'fail',
        transform: ({ index, pages }) => ({
          index: `${index}\n\nIndex annotation.`,
          pages: Object.fromEntries(
            Object.entries(pages).map(([route, content]) => [
              route,
              `${content}\n\nPage annotation.`,
            ]),
          ),
        }),
      },
    },
  })
  const server = await createServer({
    root: rootDir,
    configFile: false,
    logLevel: 'silent',
    plugins: [
      llms(config),
      {
        name: 'test-negotiated-markdown',
        configureServer(server) {
          const app = new Hono()
          app.use('*', MdRouter.middleware())
          app.get('*', (context) => context.notFound())
          server.middlewares.use(async (request, response, next) => {
            if (request.url !== '/index') return next()
            const result = await app.request(`http://${request.headers.host}/index`, {
              headers: { accept: 'text/markdown' },
            })
            response.statusCode = result.status
            result.headers.forEach((value, name) => {
              response.setHeader(name, value)
            })
            response.end(await result.text())
          })
        },
      },
    ],
    resolve: { alias: { 'site-components': path.join(rootDir, 'component.ts') } },
    server: { host: '127.0.0.1', port: 0 },
  })
  try {
    await server.listen()
    const address = server.httpServer?.address()
    if (!address || typeof address === 'string') throw new Error('Missing server address')
    const origin = `http://127.0.0.1:${address.port}`
    expect(await (await fetch(`${origin}/llms.txt`)).text()).toContain('Index annotation.')
    const page = await (await fetch(`${origin}/assets/md/index.md`)).text()
    expect(page).toContain('Page annotation.')
    expect(page).toContain('Alias rendered')
    const negotiated = await fetch(`${origin}/index`, { headers: { accept: 'text/markdown' } })
    expect(negotiated.status).toBe(200)
    expect(await negotiated.text()).toBe(page)
    expect((await fetch(`${origin}/assets/md/missing.md`)).status).toBe(404)
  } finally {
    await server.close()
  }
  await build({
    root: rootDir,
    configFile: false,
    logLevel: 'silent',
    plugins: [llms(config)],
    resolve: { alias: { 'site-components': path.join(rootDir, 'component.ts') } },
    build: { outDir: 'dist/public' },
  })
  const directory = path.join(rootDir, 'dist/public')
  const index = await fs.readFile(path.join(directory, 'llms.txt'), 'utf8')
  const page = await fs.readFile(path.join(directory, 'assets/md/index.md'), 'utf8')
  const full = await fs.readFile(path.join(directory, 'llms-full.txt'), 'utf8')
  const manifest = JSON.parse(
    await fs.readFile(path.join(directory, 'markdown-manifest.json'), 'utf8'),
  )
  expect(index).toContain('Index annotation.')
  expect(page).toContain('Page annotation.')
  expect(full).toContain(index)
  expect(full).toContain(page)
  expect(manifest.files['/index.md']).toBe(createHash('sha256').update(page).digest('hex'))
  expect(manifest.files['/llms.txt']).toBe(createHash('sha256').update(index).digest('hex'))
})

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all([...tempDirs].map((dir) => fs.rm(dir, { force: true, recursive: true })))
  tempDirs.clear()
})

describe('openapi client modules', () => {
  const specs = {
    '/first': { client: { content: { marker: 'first-client' } } },
    '/second': { client: { content: { marker: 'second-client' } } },
  } as unknown as Record<string, OpenApi.Ir>

  test('creates one lazy document import per mount', () => {
    const manifest = openapiClientManifest(specs)

    expect(manifest).toContain('virtual:vocs/openapi-client:%2Ffirst')
    expect(manifest).toContain('virtual:vocs/openapi-client:%2Fsecond')
    expect(manifest).not.toContain('first-client')
    expect(manifest).not.toContain('second-client')
  })

  test('serializes only the requested client document', () => {
    const document = JSON.stringify(openapiClientDocument(specs, '/first'))

    expect(document).toContain('first-client')
    expect(document).not.toContain('second-client')
  })
})

describe('openapi schema model modules', () => {
  const specs = {
    '/first': {
      path: '/first',
      groups: [
        {
          id: 'pets',
          operations: [
            {
              id: 'createpet',
              parameters: [],
              requestBody: {
                content: [
                  {
                    mediaType: 'application/json',
                    schema: {
                      type: 'object',
                      properties: {
                        firstMarker: { type: 'string', description: 'first schema detail' },
                      },
                    },
                  },
                ],
              },
              responses: [],
            },
          ],
        },
        {
          id: 'owners',
          operations: [
            {
              id: 'createowner',
              parameters: [],
              requestBody: {
                content: [
                  {
                    mediaType: 'application/json',
                    schema: {
                      type: 'object',
                      properties: {
                        secondMarker: { type: 'string', description: 'second schema detail' },
                      },
                    },
                  },
                ],
              },
              responses: [],
            },
          ],
        },
      ],
    },
  } as unknown as Record<string, OpenApi.Ir>

  test('creates one lazy document import per category without inlining models', () => {
    const manifest = openapiSchemaModelsManifest(specs)

    expect(manifest).toContain('virtual:vocs/openapi-schema-models:')
    expect(manifest).toContain('pets')
    expect(manifest).toContain('owners')
    expect(manifest).not.toContain('schema detail')
  })

  test('serializes only the requested category models', () => {
    const source = JSON.stringify(['/first', 'pets'])
    const document = JSON.stringify(openapiSchemaModelsDocument(specs, source))

    expect(document).toContain('first schema detail')
    expect(document).not.toContain('second schema detail')
  })
})

describe('openapi modules', () => {
  test('dev runners read parsed specs without serializing them', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vocs-openapi-'))
    tempDirs.add(root)
    const config = Config.define({
      rootDir: root,
      openapi: [
        OpenApiSpec.from({
          path: '/api',
          spec: { openapi: '3.1.0', info: { title: 'Petstore' }, paths: {} },
        }),
      ],
    })
    Config.setGlobal(config)
    OpenApiRegistry.invalidate()
    const server = await createServer({
      configFile: false,
      logLevel: 'silent',
      root,
      plugins: [openapi(config)],
      server: { middlewareMode: true, ws: false },
    })
    try {
      const environment = server.environments.ssr
      if (!isRunnableDevEnvironment(environment)) throw new Error('expected a runnable environment')
      const { specs } = await environment.runner.import('virtual:vocs/openapi')
      const result = await environment.transformRequest('virtual:vocs/openapi')

      expect(specs).toBe(await OpenApiRegistry.build(config))
      expect(result?.code).not.toContain('Petstore')
    } finally {
      await server.close()
      OpenApiRegistry.invalidate()
    }
  })
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
