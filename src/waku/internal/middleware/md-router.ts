import type { Context, MiddlewareHandler } from 'hono'
import * as Negotiation from '../../../internal/negotiation.js'

const isDev = process.env['NODE_ENV'] !== 'production'

export async function fetchMarkdown(url: URL, assetPath: string, cookie?: string) {
  // Try reading from disk first (avoids self-fetch issues with deployment protection).
  try {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
    const filePath = path.join(distDir, 'public', assetPath.replace(/^\//, ''))
    return await fs.readFile(filePath, 'utf-8')
  } catch {}

  return fetchMarkdownFromServer(url, assetPath, cookie)
}

// Development requests use the Vite plugin's resolver-aware generation pipeline.
// Never read a previous build's files while the development server is running.
async function fetchMarkdownFromServer(url: URL, assetPath: string, cookie?: string) {
  // Fall back to HTTP fetch, forwarding cookies for auth-protected deployments.
  const assetUrl = new URL(assetPath, url.origin)
  const headers: HeadersInit = {}
  if (cookie) headers['cookie'] = cookie
  const response = await globalThis.fetch(assetUrl, { headers })
  if (!response.ok) return null
  return response.text()
}

/** Whether an exact file for `pathname` exists in the `public/` (dev) or static output (build) directory. */
async function hasPublicFile(pathname: string) {
  const relativePath = pathname.replace(/^\//, '')
  if (!relativePath) return false
  try {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')

    let publicDir: string
    if (isDev) {
      const Config = await import('../../../internal/config.js')
      const config = await Config.resolve({ server: true })
      publicDir = path.resolve(config.rootDir, 'public')
    } else {
      const { fileURLToPath } = await import('node:url')
      const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
      publicDir = path.join(distDir, 'public')
    }

    const stats = await fs.stat(path.join(publicDir, relativePath))
    return stats.isFile()
  } catch {
    return false
  }
}

export function middleware(): MiddlewareHandler {
  const read = (context: Context, assetPath: string) => {
    const url = new URL(context.req.url)
    const cookie = context.req.header('cookie')
    return isDev
      ? fetchMarkdownFromServer(url, assetPath, cookie)
      : fetchMarkdown(url, assetPath, cookie)
  }

  const negotiation = Negotiation.middleware({
    // Generated markdown twins are static output; routing them back through
    // twin resolution would trigger a recursive self-fetch.
    exclude: ['/assets/md/'],
    index: (context) => read(context, '/llms.txt'),
    resolve: (context, page) => read(context, `/assets/md${Negotiation.path(page)}`),
  })

  return async (context, next) => {
    const { pathname } = new URL(context.req.url)
    // A file physically present in `public/` wins over markdown-twin resolution,
    // so static `.md` files (skill manifests, plain markdown) are served as-is.
    if (pathname.endsWith('.md') && (await hasPublicFile(pathname))) return next()
    return negotiation(context, next)
  }
}

export default middleware
