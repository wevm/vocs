import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type * as Config from '../internal/config.js'
import { Head, resolveHeadOption, resolveMetaOption, resolveTitleTemplate } from './Head.js'
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

  test('resolves path-aware meta config', () => {
    const config = {
      head: {
        meta: {
          articleModifiedTime: (path) => !path.startsWith('/docs'),
          twitterImage: false,
        },
      },
    } satisfies Pick<Config.Config, 'head'>

    expect(resolveMetaOption(config, 'articleModifiedTime', '/docs/intro', undefined)).toBe(false)
    expect(resolveMetaOption(config, 'articleModifiedTime', '/blog/post', undefined)).toBe(true)
    expect(resolveMetaOption(config, 'twitterImage', '/blog/post', undefined)).toBe(false)
    expect(resolveMetaOption(config, 'ogTitle', '/blog/post', undefined)).toBe(true)
  })

  test('resolves path-aware core head config', () => {
    const config = {
      head: {
        canonical: (path) => path !== '/preview',
        description: false,
      },
    } satisfies Pick<Config.Config, 'head'>

    expect(resolveHeadOption(config, 'canonical', '/preview', undefined)).toBe(false)
    expect(resolveHeadOption(config, 'canonical', '/docs', undefined)).toBe(true)
    expect(resolveHeadOption(config, 'description', '/docs', undefined)).toBe(false)
    expect(resolveHeadOption(config, 'title', '/docs', undefined)).toBe(true)
  })

  test('renders route-aware title and omits disabled meta tags', () => {
    mocks.path = '/docs/intro'
    mocks.config = createConfig({
      head: {
        meta: {
          articleModifiedTime: (path) => !path.startsWith('/docs'),
          ogImage: false,
          twitterImage: false,
        },
      },
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
    expect(html).not.toContain('property="twitter:image"')
    expect(html).toContain('property="og:title" content="Intro"')
    expect(html).toContain('name="twitter:title" content="Intro"')
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
    expect(html).toContain('property="twitter:image"')
  })

  test('omits disabled core head tags', () => {
    mocks.config = createConfig({
      head: {
        base: false,
        canonical: false,
        description: false,
        icons: false,
        robots: false,
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
    expect(html).toContain('property="og:title" content="Hidden title"')
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
