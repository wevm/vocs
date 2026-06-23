import { createElement, type FunctionComponent, lazy, type ReactNode } from 'react'
import { createPages } from 'waku/router/server'
import * as DedupeHead from '../dedupe-head.js'
import {
  type ApiHandler,
  type ApiRouteModule,
  getApiHandlers,
  hasInvalidStaticApiExports,
} from './api-routes.js'
import { isIgnoredPath } from './utils/fs-router.js'

type Pages = ReturnType<typeof createPages>
type RouteModule = ApiRouteModule & {
  default: FunctionComponent<{ children: ReactNode }> | { fetch: ApiHandler }
}

type RenderHtml = (
  elementsStream: ReadableStream,
  html: ReactNode,
  options: { rscPath: string; actionResult?: unknown; status?: number },
) => Promise<Response>

const wrapRenderHtml =
  (renderHtml: RenderHtml): RenderHtml =>
  async (...args) => {
    const response = await renderHtml(...args)
    const body = response.body
    if (!body) return response
    return new Response(body.pipeThrough(DedupeHead.transformStream()), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }

const wrapPages = (pages: Pages): Pages => ({
  ...pages,
  handleRequest: async (input, utils) => {
    return pages.handleRequest(input, {
      ...utils,
      renderHtml: wrapRenderHtml(utils.renderHtml),
    })
  },
  handleBuild: async (utils) => {
    return pages.handleBuild({
      ...utils,
      renderHtml: wrapRenderHtml(utils.renderHtml),
    })
  },
})

export function router(
  /**
   * A mapping from a file path to a route module, e.g.
   *   {
   *     "./pages/_layout.tsx": () => ({ default: ... }),
   *     "./pages/index.tsx": () => ({ default: ... }),
   *     "./pages/foo/index.tsx": () => ...,
   *   }
   * Intended to be created by Vite's import.meta.glob with the pages
   * directory included in the pattern, e.g.
   *   import.meta.glob("./pages/**\/*.{tsx,ts}")
   */
  modules: { [file: string]: () => Promise<unknown> },
  options?: {
    /**
     * The pages directory name. Must match the directory in the glob
     * pattern, e.g. `"pages"` for `import.meta.glob('./pages/**\/*')`.
     * Glob keys whose first segment doesn't match are ignored.
     * Defaults to `"pages"`.
     */
    pagesDir?: string
    /** The source directory name. Used to normalize absolute Vite glob keys. */
    srcDir?: string
    /** e.g. `"_api"` will detect pages in `src/pages/_api` and strip `_api` from the path. */
    apiDir?: string
    /** e.g. `"_slices"` will detect slices in `src/pages/_slices`. */
    slicesDir?: string
    unstable_skipBuild?: (routePath: string) => boolean
  },
): Pages {
  const {
    pagesDir = 'pages',
    srcDir,
    apiDir = '_api',
    slicesDir = '_slices',
    unstable_skipBuild,
  } = options || {}

  const pagesDirPrefix = pagesDir + '/'
  const toSrcPath = (file: string) => {
    // Use WHATWG URL encoding for the file path (different from RFC2396-based encoding).
    let srcPath = new URL(file, 'http://localhost:3000').pathname.slice(1)
    if (srcDir && srcPath.startsWith(`${srcDir}/`)) srcPath = srcPath.slice(srcDir.length + 1)
    if (!srcPath.startsWith(pagesDirPrefix)) srcPath = pagesDirPrefix + srcPath
    return srcPath
  }

  const defaultFiles = import.meta.glob(`../routes/**/*.{tsx,ts,js}`)
  const defaultPages = Object.fromEntries(
    Object.entries(defaultFiles).map(([file, module]) => [
      `./${pagesDir}/${file.replace('../routes/', '')}`,
      module,
    ]),
  )

  const consumerPaths = new Set<string>()
  // Consumer page modules keyed by their final route path (e.g.
  // `/api/activities`). Used to compose OpenAPI "override" pages: a consumer
  // page mounted at an OpenAPI route supplies the intro content while the
  // generated reference body still renders below it.
  const consumerModules = new Map<string, () => Promise<unknown>>()
  for (const file in modules) {
    const srcPath = toSrcPath(file)
    consumerPaths.add(srcPath.slice(pagesDirPrefix.length).replace(/\.\w+$/, ''))
    const importFn = modules[file]
    if (importFn) {
      const items = srcPath
        .slice(pagesDirPrefix.length)
        .replace(/\.\w+$/, '')
        .split('/')
        .filter(Boolean)
      const last = items.at(-1)
      const route =
        '/' +
        (last && (['_layout', 'index', '_root'].includes(last) || last.startsWith('_part'))
          ? items.slice(0, -1)
          : items
        ).join('/')
      consumerModules.set(route, importFn)
    }
  }

  const allModules = { ...defaultPages, ...modules }

  return wrapPages(
    createPages(
      async ({ createPage, createLayout, createRoot, createApi, createSlice }) => {
        // OpenAPI config/specs (data-only virtual modules, safe to import
        // eagerly). The set of OpenAPI route paths lets the page loop below skip
        // creating a standalone page for any consumer override mounted at one of
        // them — the OpenAPI loop owns that route and renders the override as the
        // page intro.
        const { config } = await import('virtual:vocs/config')
        const { specs } = await import('virtual:vocs/openapi')
        const openapiRoutePaths = new Set<string>()
        for (const entry of config.openapi ?? []) {
          openapiRoutePaths.add(entry.path)
          for (const group of specs[entry.path]?.groups ?? [])
            openapiRoutePaths.add(`${entry.path}/${group.id}`)
        }

        // A consumer page mounted under a section path (e.g. `/api/auth`) that
        // isn't a generated route — a "guide" page rendered with the section
        // layout (see the OpenAPI loop below).
        const isOpenApiGuidePath = (path: string) =>
          !openapiRoutePaths.has(path) &&
          (config.openapi ?? []).some((entry) => path.startsWith(`${entry.path}/`))

        for (const file in allModules) {
          const importFn = allModules[file]
          if (!importFn) continue
          if (file.endsWith('_mdx-wrapper.tsx')) continue

          const srcPath = toSrcPath(file)
          if (!srcPath.startsWith(pagesDirPrefix)) continue

          const pathItems = srcPath
            .slice(pagesDirPrefix.length)
            .replace(/\.\w+$/, '')
            .split('/')
            .filter(Boolean)
          if (isIgnoredPath(pathItems)) continue

          const isBuiltIn = file in defaultPages && !(file in modules)
          const normalizedPath = pathItems.join('/')
          if (isBuiltIn && consumerPaths.has(normalizedPath)) continue

          const path =
            '/' +
            // biome-ignore lint/style/noNonNullAssertion: upstream Waku fsRouter does the same.
            (['_layout', 'index', '_root'].includes(pathItems.at(-1)!) ||
            pathItems.at(-1)?.startsWith('_part')
              ? pathItems.slice(0, -1)
              : pathItems
            ).join('/')

          // A consumer page mounted at an OpenAPI route is an "override": skip
          // creating a standalone page here so the OpenAPI loop can mount it
          // with the generated reference body (it reads the same module as the
          // page intro).
          if (openapiRoutePaths.has(path)) continue

          // A consumer page mounted *under* an OpenAPI section path (e.g.
          // `/api/auth`) but not at a generated route is a "guide" page. Skip it
          // here so the OpenAPI loop can mount it with the section layout.
          if (isOpenApiGuidePath(path)) continue

          const sourceFile = isBuiltIn ? undefined : srcPath
          const sourceFileProperty = sourceFile ? { unstable_sourceFile: sourceFile } : {}

          const mdxRegex = /\.mdx?$/
          if (mdxRegex.test(file)) {
            if (file.replace(mdxRegex, '.tsx') in allModules) continue

            const component = lazy(() =>
              (importFn() as Promise<{ Page: FunctionComponent }>).then((mod) => ({
                default: mod.Page,
              })),
            )
            if (pathItems.at(-1) === '[path]') {
              throw new Error(
                'Page file cannot be named [path]. This will conflict with the path prop of the page component.',
              )
            } else if (pathItems.at(0) === slicesDir) {
              createSlice({
                component,
                render: 'static',
                id: pathItems.slice(1).join('/'),
                ...sourceFileProperty,
              } as never)
            } else if (pathItems.at(-1) === '_root') {
              createRoot({
                component,
                render: 'static',
                ...sourceFileProperty,
              })
            } else {
              createPage({
                path,
                component,
                render: 'static',
                ...sourceFileProperty,
              } as never)
            }
            continue
          }

          const mod = (await importFn()) as RouteModule

          const config = await mod.getConfig?.()
          if (pathItems.at(0) === apiDir) {
            // Strip the apiDir prefix from the path (e.g., _api/hello.txt -> hello.txt)
            const apiPath = '/' + pathItems.slice(1).join('/')
            if (config?.render === 'static') {
              if (hasInvalidStaticApiExports(mod) || !mod.GET) {
                console.warn(
                  `API ${path} is invalid. For static API routes, only a single GET handler is supported.`,
                )
              }
              createApi({
                ...config,
                path: apiPath,
                render: 'static',
                method: 'GET',
                // biome-ignore lint/style/noNonNullAssertion: upstream Waku fsRouter does the same.
                handler: mod.GET!,
                ...sourceFileProperty,
              })
            } else {
              createApi({
                path: apiPath,
                render: 'dynamic',
                handlers: getApiHandlers(mod, path),
                ...sourceFileProperty,
              })
            }
          } else if (pathItems.at(-1) === '[path]') {
            throw new Error(
              'Page file cannot be named [path]. This will conflict with the path prop of the page component.',
            )
          } else if (typeof mod.default === 'object' && 'fetch' in mod.default) {
            throw new Error('API routes must be defined in the _api directory.')
          } else if (pathItems.at(0) === slicesDir) {
            createSlice({
              component: mod.default,
              render: 'static',
              id: pathItems.slice(1).join('/'),
              ...config,
              ...sourceFileProperty,
            } as never) // FIXME avoid as never
          } else if (pathItems.at(-1) === '_layout') {
            createLayout({
              path,
              component: mod.default,
              render: 'static',
              ...config,
              ...sourceFileProperty,
            })
          } else if (pathItems.at(-1) === '_root') {
            createRoot({
              component: mod.default,
              render: 'static',
              ...config,
              ...sourceFileProperty,
            })
          } else {
            createPage({
              path,
              component: mod.default,
              render: 'static',
              ...config,
              ...sourceFileProperty,
            } as never) // FIXME avoid as never
          }
        }

        // Mount OpenAPI sections programmatically from config (no source files).
        // `OpenApiPage` is imported lazily inside this RSC-only callback so the
        // client-component chain (Layout) is never pulled into the shared/SSR
        // module graph.
        if (config.openapi?.length) {
          const { OpenApiGuide, OpenApiPage } = await import(
            '../../../react/internal/openapi/OpenApiPage.js'
          )

          // Resolves a consumer "override" page mounted at `routePath` into the
          // props (`intro` content + frontmatter `title`) layered onto the
          // generated `OpenApiPage`. Returns empty props when there is no
          // override. Uses the MDX `default` export (raw content) — not `Page` —
          // so the override is not wrapped in its own Layout.
          const overrideProps = async (routePath: string) => {
            const importFn = consumerModules.get(routePath)
            if (!importFn) return {}
            const mod = (await importFn()) as {
              default?: FunctionComponent
              frontmatter?: { title?: string }
            }
            if (!mod.default) return {}
            const Content = mod.default
            return { intro: createElement(Content), title: mod.frontmatter?.title }
          }

          for (const entry of config.openapi) {
            // Section root: overview listing every category.
            const rootProps = await overrideProps(entry.path)
            createPage({
              path: entry.path,
              component: () =>
                createElement(OpenApiPage, {
                  mount: entry.path,
                  endpoints: !rootProps.intro,
                  ...rootProps,
                }),
              render: 'static',
            } as never)

            // Mount one page per category at `${path}/${group}`.
            const ir = specs[entry.path]
            for (const group of ir?.groups ?? []) {
              const groupRoute = `${entry.path}/${group.id}`
              const groupProps = await overrideProps(groupRoute)
              createPage({
                path: groupRoute,
                component: () =>
                  createElement(OpenApiPage, { mount: entry.path, group: group.id, ...groupProps }),
                render: 'static',
              } as never)
            }

            // Mount consumer "guide" pages under the section (e.g. `/api/auth`)
            // with the section layout: a normal MDX page rendered full-bleed,
            // content-width, and without the right gutter/TOC.
            for (const [routePath, importFn] of consumerModules) {
              if (!routePath.startsWith(`${entry.path}/`)) continue
              if (openapiRoutePaths.has(routePath)) continue
              const mod = (await importFn()) as {
                default?: FunctionComponent
                frontmatter?: { title?: string }
              }
              if (!mod.default) continue
              const Content = mod.default
              const title = mod.frontmatter?.title
              createPage({
                path: routePath,
                component: () => createElement(OpenApiGuide, { title }, createElement(Content)),
                render: 'static',
              } as never)
            }
          }
        }

        // HACK: to satisfy the return type, unused at runtime
        return null as never
      },
      unstable_skipBuild ? { unstable_skipBuild } : undefined,
    ),
  )
}
