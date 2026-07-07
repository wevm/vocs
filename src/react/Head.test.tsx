import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type * as Config from '../internal/config.js'
import { Head, resolveHead, resolveTitleTemplate } from './Head.js'
import * as MdxPageContext from './MdxPageContext.js'

const mocks = vi.hoisted(() => ({
  config: {} as Config.Config,
  path: '/',
}))

vi.mock('waku', () => ({
  useRouter: () => ({ path: mocks.path }),
}))

vi.mock('virtual:vocs/config', () => ({
  get config() {
    return mocks.config
  },
}))

beforeEach(() => {
  mocks.path = '/'
  mocks.config = createConfig()
})

describe('Head', () => {
  test('resolves path-aware title templates', () => {
    const config = {
      title: 'Acme',
      titleTemplate: (path) => (path.startsWith('/api') ? '%s · API' : '%s · Acme'),
    } satisfies Pick<Config.Config, 'title' | 'titleTemplate'>

    expect(resolveTitleTemplate(config, '/api/reference', 'Users', undefined)).toBe('%s · API')
    expect(resolveTitleTemplate(config, '/guide', 'Install', undefined)).toBe('%s · Acme')
  })

  test('skips title template when title already includes site title', () => {
    const config = {
      title: 'Acme',
      titleTemplate: '%s · Acme',
    } satisfies Pick<Config.Config, 'title' | 'titleTemplate'>

    expect(resolveTitleTemplate(config, '/', 'Acme Docs', undefined)).toBeUndefined()
  })

  test('resolves head object config', () => {
    const config = {
      head: { meta: { description: 'Custom', twitterImage: false } },
    } satisfies Pick<Config.Config, 'head'>

    expect(resolveHead(config, '/docs', undefined)).toEqual({
      meta: { description: 'Custom', twitterImage: false },
    })
    expect(resolveHead({}, '/docs', undefined)).toEqual({})
  })

  test('resolves path-aware head config', () => {
    const config = {
      head: (path) => {
        if (path.startsWith('/preview')) return false
        if (path.startsWith('/blog')) return { meta: { ogType: 'article' } }
        return undefined
      },
    } satisfies Pick<Config.Config, 'head'>

    expect(resolveHead(config, '/preview/draft', undefined)).toBe(false)
    expect(resolveHead(config, '/blog/post', undefined)).toEqual({ meta: { ogType: 'article' } })
    expect(resolveHead(config, '/docs', undefined)).toEqual({})
  })

  test('renders default metadata when head config is omitted', () => {
    mocks.path = '/blog/post'

    const html = renderHead({
      author: 'Jane',
      description: 'Blog post',
      lastModified: '2026-01-01T00:00:00.000Z',
      title: 'Post',
    })

    expect(html).toContain('<title>Post – Acme</title>')
    expect(html).toContain('name="author" content="Jane"')
    expect(html).toContain('property="article:author" content="Jane"')
    expect(html).toContain('property="article:modified_time"')
    expect(html).toContain('property="og:image"')
    expect(html).toContain('name="twitter:image"')
  })

  test('renders arbitrary meta tags from unhead vocabulary', () => {
    mocks.config = createConfig({
      head: {
        meta: {
          appleMobileWebAppTitle: 'Acme',
          ogImageWidth: 1200,
          themeColor: '#161616',
        },
      },
    })

    const html = renderHead({ title: 'Post' })

    expect(html).toContain('name="apple-mobile-web-app-title" content="Acme"')
    expect(html).toContain('property="og:image:width" content="1200"')
    expect(html).toContain('name="theme-color" content="#161616"')
  })

  test('renders link, script, and style tags', () => {
    mocks.config = createConfig({
      head: {
        link: [
          { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
          { rel: 'alternate', type: 'application/rss+xml', href: '/feed.xml' },
        ],
        script: [
          { src: 'https://analytics.example.com/script.js', async: true },
          { textContent: 'console.log("hi")' },
          { type: 'application/ld+json', innerHTML: { '@type': 'WebSite', name: 'Acme' } },
        ],
        style: [{ textContent: ':root{--brand:#161616}' }],
      },
    })

    const html = renderHead({ title: 'Post' })

    expect(html).toContain(
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>',
    )
    expect(html).toContain('<link rel="alternate" type="application/rss+xml" href="/feed.xml"/>')
    expect(html).toContain('<script src="https://analytics.example.com/script.js" async="">')
    expect(html).toContain('<script>console.log("hi")</script>')
    expect(html).toContain(
      '<script type="application/ld+json">{"@type":"WebSite","name":"Acme"}</script>',
    )
    expect(html).toContain('<style>:root{--brand:#161616}</style>')
  })

  test('overrides tag values and cascades into downstream defaults', () => {
    mocks.config = createConfig({
      head: {
        canonical: 'https://example.com/custom',
        meta: {
          description: 'Custom description',
          ogType: 'article',
        },
      },
    })

    const html = renderHead({ description: 'Frontmatter description', title: 'Post' })

    expect(html).toContain('name="description" content="Custom description"')
    expect(html).toContain('property="og:description" content="Custom description"')
    expect(html).toContain('name="twitter:description" content="Custom description"')
    expect(html).toContain('rel="canonical" href="https://example.com/custom"')
    expect(html).toContain('property="og:url" content="https://example.com/custom"')
    expect(html).toContain('property="og:type" content="article"')
  })

  test('title override bypasses title template and cascades', () => {
    mocks.config = createConfig({ head: { title: 'Custom Title' } })

    const html = renderHead({ title: 'Post' })

    expect(html).toContain('<title>Custom Title</title>')
    expect(html).toContain('property="og:title" content="Custom Title"')
    expect(html).toContain('name="twitter:title" content="Custom Title"')
  })

  test('omits disabled tags', () => {
    mocks.config = createConfig({
      head: {
        base: false,
        canonical: false,
        icons: false,
        meta: {
          description: false,
          robots: false,
        },
        title: false,
      },
      iconUrl: '/favicon.svg',
    })

    const html = renderHead({
      description: 'Hidden description',
      title: 'Hidden title',
    })

    expect(html).not.toContain('<title>')
    expect(html).not.toContain('name="description"')
    expect(html).not.toContain('<base')
    expect(html).not.toContain('rel="canonical"')
    expect(html).not.toContain('rel="icon"')
    expect(html).not.toContain('name="robots"')
    // `false` only omits the tag itself; downstream defaults remain.
    expect(html).toContain('property="og:title" content="Hidden title"')
    expect(html).toContain('property="og:description" content="Hidden description"')
  })

  test('renders route-aware head config', () => {
    mocks.path = '/docs/intro'
    mocks.config = createConfig({
      head: (path) =>
        path.startsWith('/docs')
          ? { meta: { articleModifiedTime: false, ogImage: false, twitterImage: false } }
          : undefined,
      titleTemplate: (path) => (path.startsWith('/docs') ? '%s · Acme Docs' : '%s · Acme'),
    })

    const html = renderHead({
      description: 'Intro page',
      lastModified: '2026-01-01T00:00:00.000Z',
      title: 'Intro',
    })

    expect(html).toContain('<title>Intro · Acme Docs</title>')
    expect(html).not.toContain('article:modified_time')
    expect(html).not.toContain('property="og:image"')
    expect(html).not.toContain('name="twitter:image"')
    expect(html).toContain('property="og:title" content="Intro"')
    expect(html).toContain('name="twitter:title" content="Intro"')
  })

  test('disables all generated tags with `head: false`', () => {
    mocks.config = createConfig({ head: false, iconUrl: '/favicon.svg' })

    const html = renderHead({ description: 'Hidden', title: 'Hidden' })

    expect(html).not.toContain('<title>')
    expect(html).not.toContain('name="description"')
    expect(html).not.toContain('rel="icon"')
    expect(html).not.toContain('og:')
    expect(html).not.toContain('twitter:')
    // Functional tags are unaffected.
    expect(html).toContain('name="color-scheme"')
  })
})

function renderHead(frontmatter: Config.Frontmatter | undefined) {
  return renderToStaticMarkup(
    <MdxPageContext.Provider frontmatter={frontmatter}>
      <Head />
    </MdxPageContext.Provider>,
  )
}

function createConfig(config: Partial<Config.Config> = {}): Config.Config {
  const baseConfig: Config.Config = {
    accentColor: 'light-dark(black, white)',
    basePath: '/',
    baseUrl: 'https://example.com',
    cacheDir: '/tmp/vocs-cache',
    checkDeadlinks: true,
    codeHighlight: {
      langAlias: {},
      langs: [],
      themes: { dark: 'github-dark-dimmed', light: 'github-light' },
    },
    colorScheme: 'light dark',
    description: 'Acme docs',
    feedback: false,
    outDir: 'dist',
    pagesDir: 'pages',
    renderStrategy: 'dynamic',
    rootDir: '/site',
    search: {
      boost: {},
      boostDocument: () => 1,
      combineWith: 'AND',
      fuzzy: 0.2,
      prefix: true,
      query: {
        boost: {},
        combineWith: 'AND',
        fuzzy: 0.2,
        prefix: true,
      },
    },
    srcDir: 'src',
    title: 'Acme',
    titleTemplate: '%s – Acme',
    trailingSlashRedirect: true,
  }
  return { ...baseConfig, ...config }
}
