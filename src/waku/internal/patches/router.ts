import { type FunctionComponent, lazy, type ReactNode } from 'react'
import { createPages } from 'waku/router/server'
import * as DedupeHead from '../dedupe-head.js'
import { isIgnoredPath } from './utils/fs-router.js'

type Pages = ReturnType<typeof createPages>
type Method = (typeof METHODS)[number]

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

const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']

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
  for (const file in modules) {
    const srcPath = toSrcPath(file)
    consumerPaths.add(srcPath.slice(pagesDirPrefix.length).replace(/\.\w+$/, ''))
  }

  const allModules = { ...defaultPages, ...modules }

  return wrapPages(
    createPages(
      async ({ createPage, createLayout, createRoot, createApi, createSlice }) => {
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

          const mod = (await importFn()) as {
            default:
              | FunctionComponent<{ children: ReactNode }>
              | { fetch: (req: Request) => Promise<Response> }
            getConfig?: () => Promise<{
              render?: 'static' | 'dynamic'
            }>
            GET?: (req: Request) => Promise<Response>
          }

          const config = await mod.getConfig?.()
          if (pathItems.at(0) === apiDir) {
            // Strip the apiDir prefix from the path (e.g., _api/hello.txt -> hello.txt)
            const apiPath = '/' + pathItems.slice(1).join('/')
            if (config?.render === 'static') {
              if (Object.keys(mod).length !== 2 || !mod.GET) {
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
              const validMethods = new Set<string>(METHODS)
              const handlers = Object.fromEntries(
                Object.entries(mod).flatMap(([exportName, handler]) => {
                  const isValidExport =
                    exportName === 'getConfig' ||
                    exportName === 'default' ||
                    validMethods.has(exportName as Method)
                  if (!isValidExport) {
                    console.warn(
                      `API ${path} has an invalid export: ${exportName}. Valid exports are: ${METHODS.join(
                        ', ',
                      )}`,
                    )
                  }
                  return isValidExport && exportName !== 'getConfig'
                    ? exportName === 'default'
                      ? [['all', handler]]
                      : [[exportName, handler]]
                    : []
                }),
              )
              createApi({
                path: apiPath,
                render: 'dynamic',
                handlers,
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
        // HACK: to satisfy the return type, unused at runtime
        return null as never
      },
      unstable_skipBuild ? { unstable_skipBuild } : undefined,
    ),
  )
}
