import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type * as Config from '../../../internal/config.js'
import type { Ir } from '../../../internal/openapi/parser.js'
import { OpenApiGuide, OpenApiPage } from './OpenApiPage.js'

const mocks = vi.hoisted(() => ({
  config: {} as Config.Config,
  path: '/api',
  referenceGroup: vi.fn((_props: { modelSource?: string | undefined }) => null),
  specs: {} as Record<string, Ir>,
}))

vi.mock('waku', () => ({
  useRouter: () => ({ path: mocks.path }),
}))

vi.mock('virtual:vocs/config', () => ({
  get config() {
    return mocks.config
  },
}))

vi.mock('virtual:vocs/openapi', () => ({
  get specs() {
    return mocks.specs
  },
}))

vi.mock('../../Layout.client.js', () => ({
  Main: (props: { children: React.ReactNode }) => props.children,
}))

vi.mock('./Endpoints.js', () => ({
  Endpoints: () => null,
}))

vi.mock('./HeadingAnchor.js', () => ({
  HeadingAnchor: () => null,
}))

vi.mock('./Playground.client.js', () => ({
  PlaygroundProvider: (props: { children: React.ReactNode }) => props.children,
}))

vi.mock('./Reference.js', () => ({
  Prose: () => null,
  ReferenceGroup: mocks.referenceGroup,
  ReferenceOverview: () => null,
}))

beforeEach(() => {
  mocks.referenceGroup.mockClear()
  mocks.config = createConfig()
  mocks.path = '/api'
  mocks.specs = {
    '/api': {
      client: { url: 'https://example.com/openapi.json' },
      groups: [
        {
          description: 'Send and track payments through the API.',
          id: 'payments',
          name: 'Payments',
          operations: [],
        },
      ],
      info: { title: 'Tempo API' },
      path: '/api',
      securitySchemes: {},
      servers: [],
      traits: [],
    },
  }
})

describe('OpenAPI page metadata', () => {
  test('preserves custom landing page frontmatter in generated head tags', () => {
    const html = renderToStaticMarkup(
      <OpenApiPage
        frontmatter={{
          author: 'Tempo',
          description: 'Explore the Tempo API.',
          robots: 'noindex',
          socialImage: 'https://example.com/api.png',
          title: 'Tempo API Reference',
        }}
        intro={<p>Custom introduction</p>}
        mount="/api"
      />,
    )

    expect(html).toContain('name="description" content="Explore the Tempo API."')
    expect(html).toContain('name="author" content="Tempo"')
    expect(html).toContain('name="robots" content="noindex"')
    expect(html).toContain('property="og:title" content="Tempo API Reference"')
    expect(html).toContain('property="og:description" content="Explore the Tempo API."')
    expect(html).toContain('property="og:image" content="https://example.com/api.png"')
    expect(html).toContain('name="twitter:title" content="Tempo API Reference"')
    expect(html).toContain('name="twitter:description" content="Explore the Tempo API."')
  })

  test('preserves authored child page frontmatter in generated head tags', () => {
    mocks.path = '/api/authentication'

    const html = renderToStaticMarkup(
      <OpenApiGuide
        frontmatter={{
          description: 'Authenticate Tempo API requests.',
          lastModified: '2026-07-28T00:00:00.000Z',
          title: 'Authentication',
        }}
      >
        <h1>Authentication</h1>
      </OpenApiGuide>,
    )

    expect(html).toContain('name="description" content="Authenticate Tempo API requests."')
    expect(html).toContain('property="article:modified_time"')
    expect(html).toContain('property="og:title" content="Authentication"')
    expect(html).toContain('property="og:description" content="Authenticate Tempo API requests."')
    expect(html).toContain('name="twitter:title" content="Authentication"')
    expect(html).toContain('name="twitter:description" content="Authenticate Tempo API requests."')
  })

  test('uses the generated group metadata in head tags', () => {
    mocks.path = '/api/payments'

    const html = renderToStaticMarkup(<OpenApiPage group="payments" mount="/api" />)

    expect(html).toContain('<title>Payments · Tempo API</title>')
    expect(html).toContain('name="description" content="Send and track payments through the API."')
    expect(html).toContain('property="og:title" content="Payments · Tempo API"')
    expect(html).toContain(
      'property="og:description" content="Send and track payments through the API."',
    )
    expect(html).toContain('name="twitter:title" content="Payments · Tempo API"')
    expect(html).toContain(
      'name="twitter:description" content="Send and track payments through the API."',
    )
  })

  test('keeps standalone category schema models inline', () => {
    renderToStaticMarkup(<OpenApiPage group="payments" inlineSchemaModels mount="/api" />)

    expect(mocks.referenceGroup.mock.calls[0]?.[0].modelSource).toBeUndefined()
  })

  test('loads generated category schema models by default', () => {
    renderToStaticMarkup(<OpenApiPage group="payments" mount="/api" />)

    expect(mocks.referenceGroup.mock.calls[0]?.[0].modelSource).toBe('["/api","payments"]')
  })
})

function createConfig(): Config.Config {
  return {
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
    description: 'Tempo developer documentation.',
    feedback: false,
    head: (_path, { frontmatter }) => ({
      meta: {
        ogImage:
          typeof frontmatter?.['socialImage'] === 'string' ? frontmatter['socialImage'] : undefined,
      },
    }),
    jsonLd: true,
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
    title: 'Tempo',
    titleTemplate: '%s – Tempo',
    trailingSlashRedirect: true,
  }
}
