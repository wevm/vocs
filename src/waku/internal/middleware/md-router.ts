import type { MiddlewareHandler } from 'hono'
import {
  aiUserAgents,
  ogBotUserAgents,
  representationVary,
  searchEngineUserAgents,
  terminalUserAgents,
} from '../../../internal/markdown-negotiation.js'

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
  return async (context, next) => {
    const url = new URL(context.req.url)

    // Generated markdown twins are static output; routing them back through
    // twin resolution would trigger a recursive self-fetch.
    if (url.pathname.startsWith('/assets/md/')) return next()

    const isMarkdownRequest = url.pathname.endsWith('.md')

    // A file physically present in `public/` wins over markdown-twin resolution,
    // so static `.md` files (skill manifests, plain markdown) are served as-is.
    if (isMarkdownRequest && (await hasPublicFile(url.pathname))) return next()

    // Static assets (`.json`, `.svg`, `.png`, ...) have no markdown twin. Skip
    // twin resolution so a disk miss never falls back to a slow self-fetch.
    const filename = url.pathname.split('/').pop() ?? ''
    if (!isMarkdownRequest && filename.includes('.')) return next()

    const nextWithVary = async () => {
      await next()
      context.header('Vary', representationVary, { append: true })
    }

    const userAgent = context.req.header('user-agent') ?? ''
    const isOgBot = ogBotUserAgents.some((agent) => userAgent.includes(agent))
    if (isOgBot) return nextWithVary()

    const isAiAgent = aiUserAgents.some((agent) => userAgent.includes(agent))
    const isSearchEngine = searchEngineUserAgents.some((agent) => userAgent.includes(agent))
    const isTerminal = terminalUserAgents.some((agent) => userAgent.includes(agent))
    const acceptHeader = context.req.header('accept') ?? ''
    const acceptsMarkdown = acceptHeader.includes('text/markdown')

    if (url.pathname === '/' && (acceptsMarkdown || isTerminal) && !isSearchEngine) {
      const read = isDev ? fetchMarkdownFromServer : fetchMarkdown
      const text = await read(url, '/llms.txt', context.req.header('cookie'))
      if (!text) return nextWithVary()

      context.res = new Response(text, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          Vary: representationVary,
        },
      })
      return
    }

    if (!isMarkdownRequest && (isSearchEngine || (!isAiAgent && !isTerminal && !acceptsMarkdown)))
      return nextWithVary()

    const assetPath = url.pathname.endsWith('.md')
      ? `/assets/md${url.pathname}`
      : `/assets/md${url.pathname}.md`
    const read = isDev ? fetchMarkdownFromServer : fetchMarkdown
    const text = await read(url, assetPath, context.req.header('cookie'))
    if (!text) return nextWithVary()

    context.res = new Response(text, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        Vary: representationVary,
      },
    })
    return
  }
}

export default middleware
