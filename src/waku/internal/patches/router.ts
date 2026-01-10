import { type FunctionComponent, lazy, type ReactNode } from 'react'
import { createPages } from 'waku/router/server'
import * as DedupeHead from '../dedupe-head.js'
import { isIgnoredPath } from './utils/fs-router.js'

type Pages = ReturnType<typeof createPages>

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
   *     "_layout.tsx": () => ({ default: ... }),
   *     "index.tsx": () => ({ default: ... }),
   *     "foo/index.tsx": () => ...,
   *   }
   * This mapping can be created by Vite's import.meta.glob, e.g.
   *   import.meta.glob("./**\/*.{tsx,ts}", { base: "./pages" })
   */
  pages: { [file: string]: () => Promise<unknown> },
  options: {
    /** e.g. `"_api"` will detect pages in `src/pages/_api`. */
    apiDir: string
    /** e.g. `"_slices"` will detect slices in `src/pages/_slices`. */
    slicesDir: string
  } = {
    apiDir: '_api',
    slicesDir: '_slices',
  },
): Pages {
  return wrapPages(
    createPages(async ({ createPage, createLayout, createRoot, createApi, createSlice }) => {
      const defaultFiles = import.meta.glob(`../routes/**/*.{tsx,ts,js}`)
      const defaultPages = Object.fromEntries(
        Object.entries(defaultFiles).map(([file, module]) => [
          file.replace('../routes', '.'),
          module,
        ]),
      )

      const allPages = { ...defaultPages, ...pages }

      for (const file in allPages) {
        if (!allPages[file]) continue
        if (file.endsWith('_mdx-wrapper.tsx')) continue

        const importFn = allPages[file]
        if (!importFn) continue

        const pathItems = file
          // strip "./" prefix
          .replace(/^\.\//, '')
          .replace(/\.\w+$/, '')
          .split('/')
          .filter(Boolean)
        if (isIgnoredPath(pathItems)) {
          continue
        }
        const path =
          '/' +
          // biome-ignore lint/style/noNonNullAssertion: _
          (['_layout', 'index', '_root'].includes(pathItems.at(-1)!) ||
          pathItems.at(-1)?.startsWith('_part')
            ? pathItems.slice(0, -1)
            : pathItems
          ).join('/')

        // For MDX files, create a lazy component without importing the module eagerly.
        const mdxRegex = /\.mdx?$/
        if (mdxRegex.test(file)) {
          const exists = allPages[file.replace(mdxRegex, '.tsx')]
          if (exists) continue

          const component = lazy(() =>
            (importFn() as Promise<{ Page: FunctionComponent }>).then((mod) => ({
              default: mod.Page,
            })),
          )
          if (pathItems.at(-1) === '[path]') {
            throw new Error(
              'Page file cannot be named [path]. This will conflict with the path prop of the page component.',
            )
          } else if (pathItems.at(0) === options.slicesDir) {
            createSlice({
              component,
              render: 'static',
              id: pathItems.slice(1).join('/'),
            })
          } else if (pathItems.at(-1) === '_root') {
            createRoot({
              component,
              render: 'static',
            })
          } else {
            createPage({
              path,
              component,
              render: 'static',
            } as never)
          }
          continue
        }

        // For non-MDX files, import the module eagerly
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

        if (pathItems.at(0) === options.apiDir) {
          // Strip the apiDir prefix from the path (e.g., _api/chat -> chat)
          const apiPath = pathItems.slice(1).join('/')
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
              // biome-ignore lint/style/noNonNullAssertion: _
              handler: mod.GET!,
            })
          } else if (typeof mod.default === 'object' && 'fetch' in mod.default) {
            createApi({
              path: apiPath,
              render: 'dynamic',
              handlers: {
                all: mod.default.fetch,
              },
            })
          } else {
            const validMethods = new Set(METHODS)
            const handlers = Object.fromEntries(
              Object.entries(mod).flatMap(([exportName, handler]) => {
                const isValidExport =
                  exportName === 'getConfig' ||
                  exportName === 'default' ||
                  validMethods.has(exportName)
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
            })
          }
        } else if (pathItems.at(-1) === '[path]') {
          throw new Error(
            'Page file cannot be named [path]. This will conflict with the path prop of the page component.',
          )
        } else if (typeof mod.default === 'object' && 'fetch' in mod.default) {
          throw new Error('API routes must be defined in the _api directory.')
        } else if (pathItems.at(0) === options.slicesDir) {
          createSlice({
            component: mod.default,
            render: 'static',
            id: pathItems.slice(1).join('/'),
            ...config,
          })
        } else if (pathItems.at(-1) === '_layout') {
          createLayout({
            path,
            component: mod.default,
            render: 'static',
            ...config,
          })
        } else if (pathItems.at(-1) === '_root') {
          createRoot({
            component: mod.default,
            render: 'static',
            ...config,
          })
        } else {
          createPage({
            path,
            component: mod.default,
            render: 'static',
            ...config,
          } as never) // FIXME avoid as never
        }
      }
      // HACK: to satisfy the return type, unused at runtime
      return null as never
    }),
  )
}
